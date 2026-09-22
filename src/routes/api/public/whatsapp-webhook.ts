// Webhook receiver for Evolution API (or any WhatsApp gateway that POSTs
// inbound messages here). We accept a variety of payload shapes and look for:
//   - the sender's phone number (E.164 digits, no '+')
//   - the message text
// Then we match the text against pending codes and mark the row verified.
//
// Security: The Evolution API instance must include the shared token in
// either the `Authorization: Bearer <token>` header, an `x-webhook-token`
// header, or a `?token=<token>` query param. The token is stored in the
// WHATSAPP_WEBHOOK_TOKEN environment variable.

import { createFileRoute } from "@tanstack/react-router";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function extractPhone(payload: unknown): string | null {
  // Evolution API v2: data.key.remoteJid = "201098821812@s.whatsapp.net"
  // Also try other common shapes.
  const p = payload as Record<string, unknown> | null;
  if (!p) return null;
  const paths: (string | number)[][] = [
    ["data", "key", "remoteJid"],
    ["data", "from"],
    ["message", "from"],
    ["from"],
    ["sender"],
  ];
  for (const path of paths) {
    let cur: unknown = p;
    for (const k of path) {
      if (cur && typeof cur === "object" && k in (cur as object)) {
        cur = (cur as Record<string | number, unknown>)[k];
      } else {
        cur = undefined;
        break;
      }
    }
    if (typeof cur === "string" && cur.length > 0) {
      const digits = cur.split("@")[0].replace(/\D/g, "");
      if (digits.length >= 10) return digits;
    }
  }
  return null;
}

function extractText(payload: unknown): string | null {
  const p = payload as Record<string, unknown> | null;
  if (!p) return null;
  const paths: (string | number)[][] = [
    ["data", "message", "conversation"],
    ["data", "message", "extendedTextMessage", "text"],
    ["data", "body"],
    ["message", "text", "body"],
    ["message", "conversation"],
    ["body"],
    ["text"],
  ];
  for (const path of paths) {
    let cur: unknown = p;
    for (const k of path) {
      if (cur && typeof cur === "object" && k in (cur as object)) {
        cur = (cur as Record<string | number, unknown>)[k];
      } else {
        cur = undefined;
        break;
      }
    }
    if (typeof cur === "string" && cur.length > 0) return cur;
  }
  return null;
}

export const Route = createFileRoute("/api/public/whatsapp-webhook")({
  server: {
    handlers: {
      // Health check so you can visit the URL in a browser.
      GET: async () => Response.json({ ok: true, service: "whatsapp-webhook" }),

      POST: async ({ request }) => {
        const expected = process.env.WHATSAPP_WEBHOOK_TOKEN;
        if (!expected) {
          console.error("WHATSAPP_WEBHOOK_TOKEN not configured");
          return new Response("Server misconfigured", { status: 500 });
        }

        // Accept token from Authorization header, custom header, or query param.
        const url = new URL(request.url);
        const auth = request.headers.get("authorization") ?? "";
        const bearer = auth.toLowerCase().startsWith("bearer ")
          ? auth.slice(7).trim()
          : "";
        const provided =
          bearer ||
          request.headers.get("x-webhook-token") ||
          url.searchParams.get("token") ||
          "";

        if (!provided || !timingSafeEqual(provided, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        // Ignore messages we sent ourselves (fromMe).
        const fromMe =
          (payload as { data?: { key?: { fromMe?: boolean } } })?.data?.key
            ?.fromMe === true;
        if (fromMe) return Response.json({ ok: true, skipped: "fromMe" });

        const phone = extractPhone(payload);
        const text = extractText(payload);

        if (!phone || !text) {
          return Response.json({ ok: true, skipped: "no phone or text" });
        }

        // Look for a code token in the message (case-insensitive, alphanumeric >=6).
        const upper = text.toUpperCase();
        const matches = upper.match(/[A-Z0-9]{6,}/g) ?? [];
        if (matches.length === 0) {
          return Response.json({ ok: true, skipped: "no code found" });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Try each candidate code, oldest pending row first.
        for (const candidate of matches) {
          const { data: row } = await supabaseAdmin
            .from("sms_whatsapp_verifications")
            .select("id, phone, expires_at, sms_user_id")
            .eq("code", candidate)
            .eq("status", "pending")
            .maybeSingle();

          if (!row) continue;

          // Ensure the sender's phone matches (last 10 digits — strip country
          // code differences).
          const rowDigits = row.phone.replace(/\D/g, "");
          if (
            rowDigits.slice(-10) !== phone.slice(-10) ||
            new Date(row.expires_at).getTime() < Date.now()
          ) {
            await supabaseAdmin
              .from("sms_whatsapp_verifications")
              .update({ status: "expired" })
              .eq("id", row.id);
            continue;
          }

          // Mark verified.
          await supabaseAdmin
            .from("sms_whatsapp_verifications")
            .update({ status: "verified", verified_at: new Date().toISOString() })
            .eq("id", row.id);

          // Attach phone to the linked smm_user if any. If the phone already
          // belongs to an older verified guest account, merge this session into
          // that account instead of failing on the unique phone constraint.
          if (row.sms_user_id) {
            const { attachVerifiedSmmPhone } = await import(
              "@/lib/whatsapp-verification.server"
            );
            await attachVerifiedSmmPhone(supabaseAdmin, {
              phone: row.phone,
              smmUserId: row.sms_user_id,
            });
          }

          return Response.json({ ok: true, verified: true });
        }

        return Response.json({ ok: true, skipped: "no matching pending code" });
      },
    },
  },
});
