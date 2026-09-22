import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getMe } from "@/lib/smm.functions";
import { getGuestToken } from "@/lib/guest-session";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  component: DashboardLayout,
});

const TABS = [
  { to: "/dashboard", label: "الرئيسي", icon: HomeIcon, exact: true },
  { to: "/dashboard/wallet", label: "المحفظة", icon: WalletIcon, exact: false },
  { to: "/dashboard/account", label: "حسابي", icon: UserIcon, exact: false },
] as const;

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const fetchMe = useServerFn(getMe);

  const token = typeof window !== "undefined" ? getGuestToken() : null;

  useEffect(() => {
    if (!token) navigate({ to: "/" });
  }, [token, navigate]);

  const { data: _me } = useQuery({
    queryKey: ["me", token],
    queryFn: () => fetchMe({ data: { token: token! } }),
    enabled: !!token,
  });

  if (!token) return null;

  const activeIndex = TABS.findIndex((t) =>
    t.exact ? location.pathname === t.to : location.pathname.startsWith(t.to),
  );
  const isOrderPage = location.pathname.startsWith("/dashboard/order/");

  return (
    <div className="min-h-screen">
      <main className={`max-w-[520px] mx-auto ${isOrderPage ? "pb-8" : "pb-[calc(env(safe-area-inset-bottom,0px)+110px)]"}`}>
        <Outlet />
      </main>

      {/* Clean segmented glass tab bar */}
      {!isOrderPage && (
        <nav
          className="fixed inset-x-0 z-50 flex justify-center px-6 pointer-events-none"
          style={{ bottom: "calc(env(safe-area-inset-bottom,0px) + 16px)" }}
        >
          <div
            className="glass-pill pointer-events-auto flex items-center gap-2 p-2"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 40px -18px rgba(0,0,0,0.6)",
            }}
          >
            {TABS.map((t, i) => {
              const active = i === activeIndex;
              const Icon = t.icon;
              if (active) {
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className="press-scale flex items-center gap-2.5 py-3.5 px-6"
                    style={{
                      background: "rgba(255,255,255,0.88)",
                      color: "var(--primary-foreground)",
                      borderRadius: 999,
                      transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  >
                    <span className="w-[21px] h-[21px] shrink-0">
                      <Icon />
                    </span>
                    <span className="text-[14px] font-bold whitespace-nowrap tracking-tight">
                      {t.label}
                    </span>
                  </Link>
                );
              }
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  aria-label={t.label}
                  className="press-scale flex items-center justify-center py-3.5 px-5 transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)", borderRadius: 999 }}
                >
                  <span className="w-[24px] h-[24px]">
                    <Icon />
                  </span>
                </Link>
              );
            })}


          </div>
        </nav>
      )}
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 6v12a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-4" />
      <circle cx="17" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}
