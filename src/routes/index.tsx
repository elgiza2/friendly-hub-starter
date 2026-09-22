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
