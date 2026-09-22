// Kashier hosted payment page integration.
// Creates a pending deposit row and returns a signed checkout URL.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, randomUUID } from "node:crypto";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function kashierHash(merchantId: string, orderId: string, amount: string, currency: string, apiKey: string) {
  const path = `/?payment=${merchantId}.${orderId}.${amount}.${currency}`;
  return createHmac("sha256", apiKey).update(path).digest("hex");
}

export const createDepositIntent = createServerFn({ method: "POST" })
  .inputValidator((raw) =>
    z
      .object({
        token: z.string().min(16).max(64),
        amount: z.number().min(10).max(50000),
        redirectOrigin: z.string().url(),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const merchantId = process.env.KASHIER_MERCHANT_ID;
    const apiKey = process.env.KASHIER_API_KEY;
    const mode = (process.env.KASHIER_MODE ?? "test").toLowerCase() === "live" ? "live" : "test";
    if (!merchantId || !apiKey) throw new Error("Kashier keys are not configured");

    const db = await admin();
    let { data: user } = await db
      .from("sms_users")
      .select("id")
      .eq("guest_token", data.token)
      .maybeSingle();
    if (!user) {
      // Self-heal: the browser holds a token whose row is missing.
      const { data: created, error: createErr } = await db
        .from("sms_users")
        .insert({ guest_token: data.token, is_guest: true, name: "ضيف" })
        .select("id")
        .single();
      if (createErr) throw new Error(createErr.message);
      user = created;
    }

    const orderId = `dep_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
    const amount = data.amount.toFixed(2);
    const currency = "EGP";

    const { error: txErr } = await db.from("sms_transactions").insert({
      user_id: user.id,
      amount: data.amount,
      type: "deposit",
      reference: orderId,
      status: "pending",
      meta: { provider: "kashier", mode },
    });
    if (txErr) throw new Error(txErr.message);

    const hash = kashierHash(merchantId, orderId, amount, currency, apiKey);
    const redirect = `${data.redirectOrigin}/dashboard/wallet?deposit=${orderId}`;

    const params = new URLSearchParams({
      merchantId,
      orderId,
      amount,
      currency,
      hash,
      mode,
      merchantRedirect: redirect,
      failureRedirect: redirect,
      redirectMethod: "get",
      display: "ar",
      interactionSource: "Ecommerce",
      allowedMethods: "card,wallet",
    });

    return { url: `https://checkout.kashier.io/?${params.toString()}`, orderId };
  });

/** Called by wallet page after redirect back to reconcile status without waiting for the webhook. */
export const getDepositStatus = createServerFn({ method: "POST" })
  .inputValidator((raw) => z.object({ orderId: z.string().min(4).max(64) }).parse(raw))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: tx } = await db
      .from("sms_transactions")
      .select("status, amount, reference")
      .eq("reference", data.orderId)
      .eq("type", "deposit")
      .maybeSingle();
    return tx;
  });
