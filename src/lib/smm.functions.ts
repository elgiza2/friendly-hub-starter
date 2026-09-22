// TanStack server functions for the SMM followers app.
// The Supabase admin client is only loaded inside handler bodies.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Provider titles come HTML-escaped (&amp;, &#39;, ...). */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Create or fetch a guest user by its token. Called on first visit / after login page. */
export const ensureGuestUser = createServerFn({ method: "POST" })
  .inputValidator((raw) =>
    z
      .object({
        token: z.string().min(16).max(64),
        name: z.string().max(60).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: existing } = await db
      .from("sms_users")
      .select("id, name, balance, is_guest, phone")
      .eq("guest_token", data.token)
      .maybeSingle();

    if (existing) return existing;

    const { data: created, error } = await db
      .from("sms_users")
      .insert({
        guest_token: data.token,
        is_guest: true,
        name: data.name ?? "ضيف",
      })
      .select("id, name, balance, is_guest, phone")
      .single();

    if (error) throw new Error(error.message);
    return created;
  });

/** Fetch a guest user by its token — read only. */
export const getMe = createServerFn({ method: "POST" })
  .inputValidator((raw) => z.object({ token: z.string().min(16).max(64) }).parse(raw))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: user } = await db
      .from("sms_users")
      .select("id, name, balance, is_guest, phone")
      .eq("guest_token", data.token)
      .maybeSingle();
    if (user) return user;
    // Self-heal: recreate a missing row for a token the browser still holds.
    const { data: created } = await db
      .from("sms_users")
      .insert({ guest_token: data.token, is_guest: true, name: "ضيف" })
      .select("id, name, balance, is_guest, phone")
      .single();
    return created ?? null;
  });

/** Import the whole provider catalogue into public.sms_services. */
export const syncServices = createServerFn({ method: "POST" }).handler(async () => {
  const { fetchServices } = await import("./smm.server");
  const db = await admin();
  try {
    const startedAt = new Date().toISOString();
    const services = await fetchServices();
    const rows = services
      .map((s) => ({
        service_id: Number(s.service),
        name: decodeEntities(s.name),
        category: decodeEntities(s.category ?? ""),
        type: s.type ?? "",
        rate: Number(s.rate) || 0,
        min_quantity: Number(s.min) || 1,
        max_quantity: Number(s.max) || 1000,
        refill: Boolean(s.refill),
        cancel: Boolean(s.cancel),
        is_active: true,
        synced_at: startedAt,
      }))
      .filter((r) => Number.isFinite(r.service_id) && r.rate > 0);

    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await db
        .from("sms_services")
        .upsert(rows.slice(i, i + 500), { onConflict: "service_id" });
      if (error) throw new Error(error.message);
    }
    // Anything the provider no longer offers stops showing up.
    await db.from("sms_services").update({ is_active: false }).lt("synced_at", startedAt);

    return { ok: true as const, count: rows.length };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message, count: 0 };
  }
});

/** Services for the UI: served from our own catalogue, auto-imported when empty. */
export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  try {
    // Read the WHOLE catalogue in pages (PostgREST caps a single request).
    const read = async () => {
      const all: {
        service_id: number;
        name: string;
        type: string | null;
        category: string | null;
        rate: number;
        min_quantity: number;
        max_quantity: number;
      }[] = [];
      const page = 1000;
      for (let from = 0; from < 40_000; from += page) {
        const { data: chunk, error } = await db
          .from("sms_services")
          .select("service_id, name, type, category, rate, min_quantity, max_quantity")
          .eq("is_active", true)
          .gt("rate", 0)
          .order("service_id", { ascending: true })
          .range(from, from + page - 1);
        if (error) throw new Error(error.message);
        if (!chunk || chunk.length === 0) break;
        all.push(...chunk);
        if (chunk.length < page) break;
      }
      return { data: all };
    };

    let { data } = await read();


    if (!data || data.length === 0) {
      const { fetchServices } = await import("./smm.server");
      const services = await fetchServices();
      const rows = services.map((s) => ({
        service_id: Number(s.service),
        name: decodeEntities(s.name),
        category: decodeEntities(s.category ?? ""),
        type: s.type ?? "",
        rate: Number(s.rate) || 0,
        min_quantity: Number(s.min) || 1,
        max_quantity: Number(s.max) || 1000,
        refill: Boolean(s.refill),
        cancel: Boolean(s.cancel),
        is_active: true,
        synced_at: new Date().toISOString(),
      }));
      for (let i = 0; i < rows.length; i += 500) {
        await db.from("sms_services").upsert(rows.slice(i, i + 500), { onConflict: "service_id" });
      }
      data = (await read()).data;
    }

    const { classify, titleFor, PROFIT_MULTIPLIER } = await import("./service-taxonomy");

    // Hand-picked catalogue (managed from /k) wins whenever it has entries.
    const { data: picks } = await db
      .from("sms_catalog")
      .select("provider_service_id, platform, category, title, price_override, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (picks && picks.length > 0) {
      const byId = new Map((data ?? []).map((s) => [s.service_id, s]));
      const curatedList = picks.flatMap((p) => {
        const s = byId.get(p.provider_service_id);
        if (!s) return [];
        const sellRate = p.price_override
          ? Number(p.price_override)
          : Number(s.rate) * PROFIT_MULTIPLIER;
        if (!Number.isFinite(sellRate) || sellRate <= 0) return [];
        return [{
          service: s.service_id,
          name: p.title,
          rawName: s.name ?? "",
          type: s.type ?? "",
          platform: p.platform,
          cat: p.category,
          category: p.category,
          rate: sellRate.toFixed(6),
          min: String(s.min_quantity),
          max: String(s.max_quantity),
          fixedPrice: Boolean(p.price_override),
        }];
      });
      return { ok: true as const, services: curatedList };
    }

    const services = (data ?? [])
      .flatMap((s) => {
        const rawName = s.name ?? "";
        const rawCategory = s.category ?? "";
        const c = classify(rawName, rawCategory);
        if (!c) return [];

        const min = Number(s.min_quantity) || 1;
        const max = Number(s.max_quantity) || 0;
        if (max < min || min < 1) return [];

        // Provider cost per 1000 (USD) + 50% profit margin.
        const sellRate = Number(s.rate) * PROFIT_MULTIPLIER;
        if (!Number.isFinite(sellRate) || sellRate <= 0 || sellRate > 200) return [];

        return [{
          service: s.service_id,
          name: titleFor(c, rawName),
          rawName,
          type: s.type ?? "",
          platform: c.platform,
          cat: c.cat,
          category: c.cat,
          rate: sellRate.toFixed(6),
          min: String(min),
          max: String(max),
          fixedPrice: false,
        }];
      })
      .sort((a, b) => Number(a.rate) - Number(b.rate));

    return { ok: true as const, services };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message, services: [] };
  }
});

/** Place an order against the provider. Deducts balance atomically. */
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((raw) =>
    z
      .object({
        token: z.string().min(16).max(64),
        serviceId: z.number().int().positive(),
        serviceName: z.string().min(1).max(240),
        category: z.string().max(120).optional(),
        link: z.string().url().max(500),
        quantity: z.number().int().positive().max(10_000_000),
        charge: z.number().nonnegative(),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: user, error: uErr } = await db
      .from("sms_users")
      .select("id, balance")
      .eq("guest_token", data.token)
      .maybeSingle();
    if (uErr || !user) return { ok: false as const, error: "المستخدم مش موجود" };

    if (Number(user.balance) < data.charge) {
      return { ok: false as const, error: "رصيدك مش كافي. اشحن محفظتك الأول." };
    }

    // Deduct balance first (optimistic — reverse on provider failure).
    const newBalance = Number(user.balance) - data.charge;
    const { error: balErr } = await db
      .from("sms_users")
      .update({ balance: newBalance })
      .eq("id", user.id);
    if (balErr) return { ok: false as const, error: balErr.message };

    const { addOrder } = await import("./smm.server");
    const result = await addOrder(data.serviceId, data.link, data.quantity);

    if (result.error || !result.order) {
      // Refund
      await db.from("sms_users").update({ balance: user.balance }).eq("id", user.id);
      return { ok: false as const, error: result.error || "معرفناش نبعت الطلب للمزوّد" };
    }

    const { data: order, error: oErr } = await db
      .from("sms_orders")
      .insert({
        user_id: user.id,
        service_id: data.serviceId,
        service_name: data.serviceName,
        category: data.category ?? null,
        link: data.link,
        quantity: data.quantity,
        charge: data.charge,
        provider_order_id: String(result.order),
        status: "pending",
      })
      .select("id, service_name, quantity, charge, status, created_at, provider_order_id")
      .single();

    await db.from("sms_transactions").insert({
      user_id: user.id,
      amount: -data.charge,
      type: "order",
      reference: order?.id ?? null,
      status: "completed",
    });

    if (oErr) return { ok: false as const, error: oErr.message };
    return { ok: true as const, order, newBalance };
  });

/** List orders for a guest user. */
export const listMyOrders = createServerFn({ method: "POST" })
  .inputValidator((raw) => z.object({ token: z.string().min(16).max(64) }).parse(raw))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: user } = await db
      .from("sms_users")
      .select("id")
      .eq("guest_token", data.token)
      .maybeSingle();
    if (!user) return [];
    const { data: orders } = await db
      .from("sms_orders")
      .select("id, service_name, category, link, quantity, charge, status, provider_order_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    return orders ?? [];
  });

/** Refresh a single order status from the provider. */
export const refreshOrder = createServerFn({ method: "POST" })
  .inputValidator((raw) =>
    z.object({ token: z.string().min(16).max(64), orderId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: user } = await db
      .from("sms_users").select("id").eq("guest_token", data.token).maybeSingle();
    if (!user) return { ok: false as const, error: "unauthorized" };

    const { data: order } = await db
      .from("sms_orders")
      .select("id, provider_order_id")
      .eq("id", data.orderId).eq("user_id", user.id).maybeSingle();
    if (!order?.provider_order_id) return { ok: false as const, error: "مفيش طلب" };

    const { getOrderStatus } = await import("./smm.server");
    const s = await getOrderStatus(order.provider_order_id);
    if (s.error) return { ok: false as const, error: s.error };

    await db
      .from("sms_orders")
      .update({
        status: (s.status ?? "pending").toLowerCase(),
        start_count: s.start_count ? Number(s.start_count) : null,
        remains: s.remains ? Number(s.remains) : null,
      })
      .eq("id", order.id);

    return { ok: true as const, status: s.status };
  });

/** List wallet transactions (deposits + orders) for a guest user. */
export const listMyTransactions = createServerFn({ method: "POST" })
  .inputValidator((raw) => z.object({ token: z.string().min(16).max(64) }).parse(raw))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: user } = await db
      .from("sms_users")
      .select("id")
      .eq("guest_token", data.token)
      .maybeSingle();
    if (!user) return [];
    const { data: rows } = await db
      .from("sms_transactions")
      .select("id, amount, type, status, reference, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(80);
    return rows ?? [];
  });
