import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { generateGuestToken, getGuestToken, setGuestToken } from "@/lib/guest-session";
import { SupabaseSessionLink } from "@/components/SupabaseSessionLink";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | SMM Boost Hub" },
      {
        name: "description",
        content: "سجّل بحساب جوجل أو ادخل كضيف وابدأ تزويد متابعينك ومشاهداتك بأسعار مصرية.",
      },
      { property: "og:title", content: "تسجيل الدخول | SMM Boost Hub" },
      {
        property: "og:description",
        content: "سجّل بحساب جوجل أو ادخل كضيف وابدأ تزويد متابعينك ومشاهداتك بأسعار مصرية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<null | "google" | "guest">(null);

  useEffect(() => {
    if (getGuestToken()) navigate({ to: "/dashboard" });
  }, [navigate]);

  // Guest mode works fully offline — no database needed.
  function handleGuest() {
    setError(null);
    setLoading("guest");
    const token = getGuestToken() ?? generateGuestToken();
    setGuestToken(token);
    navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    setError(null);
    setLoading("google");
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/" },
      });
      if (error) throw error;
    } catch (e) {
      setError((e as Error).message || "مش قادرين نكمّل الدخول، جرب تاني");
      setLoading(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Returning signed-in users go straight to the dashboard. */}
      <SupabaseSessionLink />
      <div
        className="relative min-h-screen flex flex-col px-6 pt-[calc(env(safe-area-inset-top,0px)+56px)] pb-[calc(env(safe-area-inset-bottom,0px)+28px)] max-w-[460px] mx-auto"
        style={{ zIndex: 4 }}
        dir="rtl"
      >
        <div className="mt-6 flex-1 flex flex-col justify-end">
          <h1
            dir="ltr"
            className="text-center text-foreground leading-[1.05]"
            style={{
              fontWeight: 600,
              fontSize: 44,
              letterSpacing: "-0.02em",
              textShadow: "0 1px 24px rgba(0,0,0,0.4)",
              animation: "zeReveal 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s both",
            }}
          >
            Grow your reach
          </h1>
        </div>


        <div
          className="w-full mt-9 space-y-3"
          style={{ animation: "zeReveal 0.9s cubic-bezier(0.16,1,0.3,1) 0.78s both" }}
        >
          <GoogleButton busy={loading === "google"} onPress={handleGoogle} />

          <div className="flex items-center gap-3 !my-4">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.14)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              أو
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.14)" }} />
          </div>

          <button
            type="button"
            onClick={handleGuest}
            disabled={loading !== null}
            className="press-scale w-full flex items-center justify-center gap-2 rounded-2xl h-[54px] text-[15px] font-medium disabled:opacity-60"
            style={{
              color: "rgba(255,255,255,0.88)",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(14px)",
            }}
          >
            {loading === "guest" ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-b-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                دخول كضيف
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 text-sm text-center" style={{ color: "#ff8b8b" }}>
              {error}
            </p>
          )}
        </div>

        <p className="text-[11px] text-center mt-6" style={{ color: "rgba(255,255,255,0.42)" }}>
          بالاستمرار أنت موافق على الشروط والخصوصية.
        </p>

      </div>
    </main>
  );
}

function GoogleButton({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={busy}
      className="press-scale w-full flex items-center justify-center gap-2.5 disabled:opacity-60 ios-btn-secondary"
      style={{ color: "#fff" }}
    >
      {busy ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-b-transparent rounded-full animate-spin" />
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 0 1 0-12.4c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.3-.2-1.9H12z"
            />
          </svg>
          المتابعة بجوجل
        </>
      )}
    </button>
  );
}
