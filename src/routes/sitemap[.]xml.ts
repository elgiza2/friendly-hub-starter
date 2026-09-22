import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://megsy.online";

async function servicePaths(): Promise<string[]> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin;
    const { data: picks } = await db
      .from("sms_catalog")
      .select("provider_service_id")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(5000);
    if (picks && picks.length > 0) {
      return picks.map((p) => `/dashboard/order/${p.provider_service_id}`);
    }
    const { data } = await db
      .from("sms_services")
      .select("service_id")
      .eq("is_active", true)
      .gt("rate", 0)
      .order("service_id", { ascending: true })
      .limit(1000);
    return (data ?? []).map((s) => `/dashboard/order/${s.service_id}`);
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/dashboard", changefreq: "daily", priority: "0.9" },
          ...(await servicePaths()).map((path) => ({
            path,
            changefreq: "weekly",
            priority: "0.6",
          })),
        ];
        const urls = entries.map(
          (e) =>
            `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
