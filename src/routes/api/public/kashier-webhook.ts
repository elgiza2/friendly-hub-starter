// Kashier webhook: verifies signature and credits the wallet.
// URL: /api/public/kashier-webhook  (auth-free by convention; we verify inside)

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

function verifyKashierSignature(payload: any, apiKey: string, headerSignature: string | null): boolean {
  const data = payload?.data;
  if (!data || typeof data !== "object") return false;

  // Kashier includes signatureKeys[] listing which fields make up the signature.
  const keys: string[] | undefined = data.signatureKeys;
  const signature: string | undefined = data.signature ?? headerSignature ?? undefined;
  if (!signature) return false;

  let query: string;
  if (Array.isArray(keys) && keys.length > 0) {
    query = keys
      .map((k) => `${k}=${data[k]}`)
      .join("&");
  } else {
    // Fallback: sort all string/number scalar fields
    query = Object.keys(data)
      .filter((k) => k !== "signature" && k !== "signatureKeys")
      .sort()
      .filter((k) => ["string", "number", "boolean"].includes(typeof data[k]))
      .map((k) => `${k}=${data[k]}`)
      .join("&");
  }

  const expected = createHmac("sha256", apiKey).update(query).digest("hex");
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/kashier-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.KASHIER_API_KEY;
        if (!apiKey) return new Response("kashier not configured", { status: 500 });

        const raw = await request.text();
        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const headerSig = request.headers.get("x-kashier-signature");
        const valid = verifyKashierSignature(payload, apiKey, headerSig);
        if (!valid) {
          console.warn("[kashier-webhook] invalid signature", { keys: Object.keys(payload?.data ?? {}) });
          return new Response("invalid signature", { status: 401 });
        }

        const d = payload.data ?? {};
        const status = String(d.status ?? "").toUpperCase();
        const orderId: string | undefined = d.merchantOrderId ?? d.orderReference ?? d.orderId;
        if (!orderId) return new Response("missing orderId", { status: 400 });

        if (status !== "SUCCESS" && status !== "CAPTURED") {
          // Not paid yet or failed — record but don't credit.
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin
            .from("sms_transactions")
            .update({ status: status.toLowerCase() || "failed" })
            .eq("reference", orderId)
            .eq("type", "deposit");
          return Response.json({ ok: true, status });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: result, error } = await supabaseAdmin.rpc("sms_credit_deposit", {
          _reference: orderId,
        });
        if (error) {
          console.error("[kashier-webhook] credit failed", error);
          return new Response("credit failed", { status: 500 });
        }
        return Response.json({ ok: true, result });
      },
      GET: async () => Response.json({ ok: true, route: "kashier-webhook" }),
    },
  },
});
