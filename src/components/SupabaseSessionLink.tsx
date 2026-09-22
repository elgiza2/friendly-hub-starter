import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { linkSupabaseUser } from "@/lib/auth.functions";
import { ensureGuestUser } from "@/lib/smm.functions";
import { generateGuestToken, getGuestToken, setGuestToken } from "@/lib/guest-session";

/**
 * Once a Supabase (Google) session is live, link the identity to the app's user
 * row (the same guest-token identity the rest of the app uses) and enter the
 * dashboard. Rendered on the login page; also brings returning signed-in users
 * straight to the dashboard.
 */
export function SupabaseSessionLink() {
  const navigate = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.auth.getSession();
        if (!data.session || done.current) return;
        done.current = true;
        let token = getGuestToken();
        if (!token) {
          token = generateGuestToken();
          setGuestToken(token);
        }
        await ensureGuestUser({ data: { token } });
        const linked = await linkSupabaseUser({ data: { token } });
        if (!linked.ok) console.warn("[auth] link failed:", linked.error);
        if (!cancelled) navigate({ to: "/dashboard" });
      } catch (err) {
        console.error("[auth] session bootstrap failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return null;
}
