// Server-only helpers for the smmfollows.com API provider.
// Never import from client code.

const API_URL = "https://smmfollows.com/api/v2";

async function callSmm<T = unknown>(params: Record<string, string | number>): Promise<T> {
  const key = process.env.SMMFOLLOWS_API_KEY;
  if (!key) throw new Error("SMMFOLLOWS_API_KEY is not configured");

  const body = new URLSearchParams();
  body.set("key", key);
  for (const [k, v] of Object.entries(params)) body.set(k, String(v));

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "Trending/1.0",
    },
    body,
  });
  if (!res.ok) throw new Error(`SMM provider HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`SMM provider invalid response: ${text.slice(0, 200)}`);
  }
}

export interface SmmService {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill?: boolean;
  cancel?: boolean;
}

export async function fetchServices(): Promise<SmmService[]> {
  const data = await callSmm<SmmService[] | { error?: string }>({ action: "services" });
  if (Array.isArray(data)) return data;
  throw new Error((data as { error?: string })?.error || "Failed to fetch services");
}

export interface AddOrderResult {
  order?: number;
  error?: string;
}
export async function addOrder(service: number, link: string, quantity: number): Promise<AddOrderResult> {
  return callSmm({ action: "add", service, link, quantity });
}

export interface OrderStatus {
  charge?: string;
  start_count?: string;
  status?: string;
  remains?: string;
  currency?: string;
  error?: string;
}
export async function getOrderStatus(providerOrderId: string): Promise<OrderStatus> {
  return callSmm({ action: "status", order: providerOrderId });
}

export async function getBalance(): Promise<{ balance?: string; currency?: string; error?: string }> {
  return callSmm({ action: "balance" });
}
