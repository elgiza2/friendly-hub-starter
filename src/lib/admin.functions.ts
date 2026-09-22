import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

type AdminSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["ADMIN_SESSION_SECRET"]!,
    name: "admin-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function requireAdmin() {
  const session = await useSession<AdminSession>(sessionConfig());
  if (!session.data.unlocked) throw new Error("UNLOCK_REQUIRED");
  return session;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  return { unlocked: Boolean(session.data.unlocked) };
});

export const adminUnlock = createServerFn({ method: "POST" })
  .inputValidator((raw) => z.object({ password: z.string().min(1).max(200) }).parse(raw))
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PANEL_PASSWORD"];
    if (!expected) return { ok: false as const };
    if (!matches(data.password, expected)) return { ok: false as const };
    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const adminLock = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

/** Everything currently in the hand-picked catalogue. */
export const adminListCatalog = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireAdmin();
    const db = await admin();
    const { data: items, error } = await db
      .from("sms_catalog")
      .select("*")
      .order("platform")
      .order("category")
      .order("sort_order");
    if (error) throw new Error(error.message);

    const ids = (items ?? []).map((i) => i.provider_service_id);
    const costs = new Map<number, { rate: number; min: number; max: number; name: string }>();
    if (ids.length) {
      const { data: rows } = await db
        .from("sms_services")
        .select("service_id, rate, min_quantity, max_quantity, name")
        .in("service_id", ids);
      for (const r of rows ?? [])
        costs.set(r.service_id, {
          rate: Number(r.rate),
          min: r.min_quantity,
          max: r.max_quantity,
          name: r.name,
        });
    }

    return {
      ok: true as const,
      items: (items ?? []).map((i) => ({
        ...i,
        cost: costs.get(i.provider_service_id) ?? null,
      })),
    };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message, items: [] };
  }
});

/** Look a provider service up by its ID (the one shown on the source site). */
export const adminLookupService = createServerFn({ method: "POST" })
  .inputValidator((raw) => z.object({ serviceId: z.number().int().positive() }).parse(raw))
  .handler(async ({ data }) => {
    try {
      await requireAdmin();
      const db = await admin();
      const { data: row, error } = await db
        .from("sms_services")
        .select("service_id, name, category, rate, min_quantity, max_quantity")
        .eq("service_id", data.serviceId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return { ok: false as const, error: "مفيش خدمة بالرقم ده" };
      return { ok: true as const, service: { ...row, rate: Number(row.rate) } };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

export const adminSaveItem = createServerFn({ method: "POST" })
  .inputValidator((raw) =>
    z
      .object({
        providerServiceId: z.number().int().positive(),
        platform: z.enum(["instagram", "tiktok", "facebook", "youtube", "telegram", "twitter"]),
        category: z.enum(["followers", "likes", "views", "comments", "shares", "reposts"]),
        title: z.string().min(1).max(160),
        priceOverride: z.number().positive().max(100000).nullable().optional(),
        sortOrder: z.number().int().min(0).max(9999).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    try {
      await requireAdmin();
      const db = await admin();
      const { error } = await db.from("sms_catalog").upsert(
        {
          provider_service_id: data.providerServiceId,
          platform: data.platform,
          category: data.category,
          title: data.title,
          price_override: data.priceOverride ?? null,
          sort_order: data.sortOrder ?? 0,
          is_active: data.isActive ?? true,
        },
        { onConflict: "provider_service_id" },
      );
      if (error) throw new Error(error.message);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

export const adminDeleteItem = createServerFn({ method: "POST" })
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data }) => {
    try {
      await requireAdmin();
      const db = await admin();
      const { error } = await db.from("sms_catalog").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });
