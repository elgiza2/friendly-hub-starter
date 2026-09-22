import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getGuestToken } from "@/lib/guest-session";
import { SupabaseSessionLink } from "@/components/SupabaseSessionLink";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | SMM Boost Hub" },
      {
        name: "description",
        content: "سجّل بحساب جوجل وابدأ تزويد متابعينك ومشاهداتك بأسعار مصرية.",
      },
      { property: "og:title", content: "تسجيل الدخول | SMM Boost Hub" },
      {
        property: "og:description",
        content: "سجّل بحساب جوجل وابدأ تزويد متابعينك ومشاهداتك بأسعار مصرية.",
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
  const [loading, setLoading] = useState<null | "google">(null);

  useEffect(() => {
    if (getGuestToken()) navigate({ to: "/dashboard" });
  }, [navigate]);

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

      {/* Cinematic vignette + light bloom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 2,
          background:
            "radial-gradient(90% 55% at 50% 12%, rgba(255,236,205,0.16) 0%, rgba(0,0,0,0) 62%), radial-gradient(120% 80% at 50% 100%, rgba(0,0,0,0.72) 20%, rgba(0,0,0,0) 70%)",
        }}
      />

      <div
        className="relative min-h-screen flex flex-col items-center px-7 pt-[calc(env(safe-area-inset-top,0px)+72px)] pb-[calc(env(safe-area-inset-bottom,0px)+36px)] max-w-[460px] mx-auto"
        style={{ zIndex: 4 }}
        dir="rtl"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span
            dir="ltr"
            className="text-[11px] uppercase"
            style={{
              letterSpacing: "0.42em",
              color: "rgba(255,255,255,0.45)",
              animation: "zeReveal 1s cubic-bezier(0.16,1,0.3,1) 0.2s both",
            }}
          >
            Megsy
          </span>

          <h1
            dir="ltr"
            className="mt-6 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: 54,
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              textShadow: "0 2px 40px rgba(0,0,0,0.55)",
              animation: "zeReveal 1.1s cubic-bezier(0.16,1,0.3,1) 0.4s both",
            }}
          >
            Grow your
            <br />
            <em style={{ fontStyle: "italic" }}>reach</em>
          </h1>

          <p
            className="mt-5 text-[13px] leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.55)",
              maxWidth: 280,
              animation: "zeReveal 1.1s cubic-bezier(0.16,1,0.3,1) 0.62s both",
            }}
          >
            متابعين ومشاهدات حقيقية لكل منصاتك، بأسعار مصرية وتنفيذ فوري.
          </p>
        </div>

        <div
          className="w-full space-y-3"
          style={{ animation: "zeReveal 1s cubic-bezier(0.16,1,0.3,1) 0.85s both" }}
        >
          <div
            aria-hidden
            className="mx-auto mb-7 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
          <GoogleButton busy={loading === "google"} onPress={handleGoogle} />

          {error && (
            <p className="mt-4 text-sm text-center" style={{ color: "#ff8b8b" }}>
              {error}
            </p>
          )}

          <p className="text-[11px] text-center pt-4" style={{ color: "rgba(255,255,255,0.34)" }}>
            بالاستمرار أنت موافق على الشروط والخصوصية.
          </p>
        </div>
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
