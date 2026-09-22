import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/smm.functions";
import { clearGuestToken, getGuestToken } from "@/lib/guest-session";

export const Route = createFileRoute("/dashboard/account")({
  component: AccountPage,
});

const SUPPORT_WA = "201098125727";

function AccountPage() {
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? getGuestToken() : null;
  const fetchMe = useServerFn(getMe);
  const { data: me } = useQuery({
    queryKey: ["me", token],
    queryFn: () => fetchMe({ data: { token: token! } }),
    enabled: !!token,
  });

  function signOut() {
    clearGuestToken();
    navigate({ to: "/" });
  }

  const initials = (me?.name ?? "ض").trim().slice(0, 1).toUpperCase();

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+30px)] pb-4 space-y-6">
      <h1
        className="text-[30px] leading-[1.15] font-semibold tracking-tight anim-rise"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        الإعدادات
      </h1>

      {/* Identity card */}
      <div className="ios-card p-4 flex items-center gap-4 anim-reveal">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "var(--accent-foreground)",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-semibold tracking-tight truncate">
            {me?.name ?? "ضيف"}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {me?.is_guest === false ? "حساب موثّق" : "حساب ضيف"}
          </div>
        </div>
        <div className="text-left shrink-0">
          <div className="text-[17px] font-semibold tracking-tight">
            {Number(me?.balance ?? 0).toFixed(2)}
          </div>
          <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            ج.م
          </div>
        </div>
      </div>

      {/* Sections */}
      <Section title="الحساب" delay="0.08s">
        <Row to="/dashboard/orders" label="طلباتي" />
        <Row to="/dashboard/wallet" label="المحفظة" last />
      </Section>

      <Section title="الدعم" delay="0.14s">
        <a
          href={`https://wa.me/${SUPPORT_WA}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ios-row ios-row-last w-full press-scale"
        >
          <span className="flex-1 font-medium text-[15px]">تواصل مع الدعم</span>
          <Chevron />
        </a>
      </Section>

      <SignOutButton />

    </div>
  );
}

function SignOutButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={async () => {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          await supabase.auth.signOut();
        } catch {
          /* not signed in */
        }
        clearGuestToken();
        navigate({ to: "/" });
      }}
      className="ios-btn-secondary press-scale w-full anim-reveal"
      style={{ color: "var(--destructive)", animationDelay: "0.2s" }}
    >
      تسجيل الخروج
    </button>
  );
}

function Section({
  title,
  delay,
  children,
}: {
  title: string;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <div className="anim-reveal" style={{ animationDelay: delay }}>
      <div
        className="text-[12px] mb-2 px-1"
        style={{ color: "var(--muted-foreground)" }}
      >
        {title}
      </div>
      <div className="ios-list">{children}</div>
    </div>
  );
}

function Row({ to, label, last }: { to: string; label: string; last?: boolean }) {
  return (
    <Link to={to} className={`ios-row w-full press-scale ${last ? "ios-row-last" : ""}`}>
      <span className="flex-1 font-medium text-[15px]">{label}</span>
      <Chevron />
    </Link>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "rgba(242,247,243,0.35)" }}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
