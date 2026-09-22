// WhatsApp Reverse-OTP server functions.
// Flow: user asks for a code, we generate one and return a wa.me deep link.
// User sends the code from their WhatsApp to the business number.
// Evolution API webhook receives the inbound message and marks the row verified.
// The client polls checkWhatsAppVerification() until status == 'verified'.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// Normalize an Egyptian phone number to E.164 without the '+' (e.g. 201098821812).
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("1")) return "20" + digits;
  if (digits.length === 11 && digits.startsWith("01")) return "2" + digits;
  if (digits.length === 12 && digits.startsWith("201")) return digits;
  if (digits.length === 13 && digits.startsWith("0201")) return digits.slice(1);
  return null;
}

function generateCode(): string {
  // Human-friendly 6-char code, avoids ambiguous chars (0/O, 1/I).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Start a verification: create a pending row, return the code + deep link. */
export const startWhatsAppVerification = createServerFn({ method: "POST" })
  .inputValidator((raw) =>
    z
      .object({
        phone: z.string().min(6).max(20),
        guestToken: z.string().min(16).max(64).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    if (!phone) throw new Error("رقم موبايل غير صحيح");

    const db = await admin();
    const target = process.env.WHATSAPP_TARGET_NUMBER ?? "201098821812";

    const buildVerificationResponse = (row: { id: string; code: string; expires_at: string }) => {
      const message = `تفعيل حسابي: ${row.code}`;
      return {
        id: row.id,
        code: row.code,
        phone,
        targetNumber: target,
        waLink: `https://wa.me/${target}?text=${encodeURIComponent(message)}`,
        expiresAt: row.expires_at,
      };
    };

    // If there's already a live code, reuse it instead of creating another
    // attempt. This prevents normal retries/refreshes from tripping the limit.
    const { data: pending } = await db
      .from("sms_whatsapp_verifications")
      .select("id, code, expires_at")
      .eq("phone", phone)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pending) return buildVerificationResponse(pending);

    // Invalidate any existing pending row for this phone.
    await db
      .from("sms_whatsapp_verifications")
      .update({ status: "expired" })
      .eq("phone", phone)
      .eq("status", "pending");

    // Look up smm user (optional link) so we can update it on webhook.
    let smmUserId: string | null = null;
    if (data.guestToken) {
      const { data: u } = await db
        .from("sms_users")
        .select("id")
        .eq("guest_token", data.guestToken)
        .maybeSingle();
      smmUserId = u?.id ?? null;
    }

    const code = generateCode();
    const { data: row, error } = await db
      .from("sms_whatsapp_verifications")
      .insert({ phone, code, sms_user_id: smmUserId })
      .select("id, code, expires_at")
      .single();
    if (error) throw new Error(error.message);

    return buildVerificationResponse(row);
  });

/** Poll from the client to see if the webhook has marked us verified. */
export const checkWhatsAppVerification = createServerFn({ method: "POST" })
  .inputValidator((raw) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db
      .from("sms_whatsapp_verifications")
      .select("id, status, phone, expires_at, sms_user_id")
      .eq("id", data.id)
      .maybeSingle();

    if (!row) return { status: "not_found" as const };

    // Auto-expire on read to keep UI honest even without a cron.
    if (row.status === "pending" && new Date(row.expires_at).getTime() < Date.now()) {
      await db
        .from("sms_whatsapp_verifications")
        .update({ status: "expired" })
        .eq("id", row.id);
      return { status: "expired" as const, phone: row.phone };
    }

    if (row.status === "verified" && row.sms_user_id) {
      const { attachVerifiedSmmPhone } = await import("./whatsapp-verification.server");
      const attached = await attachVerifiedSmmPhone(db, {
        phone: row.phone,
        smmUserId: row.sms_user_id,
      });
      return {
        status: "verified" as const,
        phone: row.phone,
        guestToken: attached.guestToken,
      };
    }

    return { status: row.status as "pending" | "verified" | "expired", phone: row.phone };
  });
