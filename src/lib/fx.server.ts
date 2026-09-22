// Server-only USD → EGP rate with in-memory caching.

let cached: { rate: number; ts: number } | null = null;
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const FX_FALLBACK = 48.5;

export async function getRate(): Promise<number> {
  const now = Date.now();
  if (cached && now - cached.ts < TTL_MS) return cached.rate;
  let rate = FX_FALLBACK;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { accept: "application/json" },
    });
    const j = (await res.json()) as { rates?: Record<string, number> };
    if (typeof j?.rates?.EGP === "number" && j.rates.EGP > 0) rate = j.rates.EGP;
  } catch {
    /* keep fallback */
  }
  cached = { rate, ts: now };
  return rate;
}
