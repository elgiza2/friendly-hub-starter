// TanStack server function linking a Supabase-auth identity (Google sign-in)
// to the app's sms_users row, which the rest of the app addresses by guest token.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * The caller must hold a live Supabase session (bearer attached by
 * attachSupabaseAuth). We read the verified identity server-side, then link it
 * to — or create — the sms_users row behind the given guest token.
 */
export const linkSupabaseUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) =>
    z.object({ token: z.string().min(16).max(64) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    try {
      const db = await admin();
      const authId = context.userId;

      const { data: userData } = await context.supabase.auth.getUser();
      const email = userData?.user?.email ?? null;
      const meta = (userData?.user?.user_metadata ?? {}) as Record<string, unknown>;
      const metaName =
        typeof meta.full_name === "string" && meta.full_name
          ? meta.full_name
          : typeof meta.name === "string" && meta.name
            ? meta.name
            : null;
      const name = metaName || (email ? email.split("@")[0] : "حسابي");

      // Already-linked identity: keep one row per Supabase user, retarget token.
      const { data: existing } = await db
        .from("sms_users")
        .select("id, guest_token")
        .eq("auth_user_id", authId)
        .maybeSingle();

      if (existing) {
        if (existing.guest_token !== data.token) {
          await db
            .from("sms_users")
            .update({ guest_token: data.token, is_guest: false })
            .eq("id", existing.id);
        }
        return { ok: true as const };
      }

      // Otherwise link (or create) the row this guest token points at.
      const { data: guest } = await db
        .from("sms_users")
        .select("id")
        .eq("guest_token", data.token)
        .maybeSingle();

      if (guest) {
        await db
          .from("sms_users")
          .update({ auth_user_id: authId, email, name, is_guest: false })
          .eq("id", guest.id);
      } else {
        await db.from("sms_users").insert({
          guest_token: data.token,
          auth_user_id: authId,
          email,
          name,
          is_guest: false,
        });
      }
      return { ok: true as const };
    } catch (err) {
      console.error("[auth] linkSupabaseUser failed", err);
      return { ok: false as const, error: "link_failed" };
    }
  });
