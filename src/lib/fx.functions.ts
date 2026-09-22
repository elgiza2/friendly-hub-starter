// USD → EGP exchange rate, fetched from an open source with in-memory caching.

import { createServerFn } from "@tanstack/react-start";

let cached: { rate: number; ts: number } | null = null;
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const FALLBACK = 48.5;

async function fetchRate(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const egp = j?.rates?.EGP;
    if (typeof egp === "number" && egp > 0) return egp;
    throw new Error("no EGP rate");
  } catch {
    // Try secondary source
    try {
      const res2 = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const j2 = (await res2.json()) as { rates?: Record<string, number> };
      const egp = j2?.rates?.EGP;
      if (typeof egp === "number" && egp > 0) return egp;
    } catch {
      /* ignore */
    }
    return FALLBACK;
  }
}

export const getUsdEgpRate = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cached && now - cached.ts < TTL_MS) return { rate: cached.rate, cached: true };
  const rate = await fetchRate();
  cached = { rate, ts: now };
  return { rate, cached: false };
});
