import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyOrders, refreshOrder } from "@/lib/smm.functions";
import { getGuestToken } from "@/lib/guest-session";

export const Route = createFileRoute("/dashboard/orders")({
  component: OrdersPage,
});

const STATUS_MAP: Record<
  string,
  { label: string; bg: string; color: string; dot: string }
> = {
  pending:      { label: "مستني", bg: "rgba(245,183,105,0.14)", color: "#f5b769", dot: "#f5b769" },
  "in progress":{ label: "شغال",  bg: "rgba(255,255,255,0.12)", color: "#f7f8fa", dot: "#f7f8fa" },
  processing:   { label: "شغال",  bg: "rgba(255,255,255,0.12)", color: "#f7f8fa", dot: "#f7f8fa" },
  completed:    { label: "خلص",   bg: "rgba(255,255,255,0.12)", color: "#f7f8fa", dot: "#f7f8fa" },
  partial:      { label: "جزء منه خلص", bg: "rgba(245,183,105,0.14)", color: "#f5b769", dot: "#f5b769" },
  canceled:     { label: "اتلغى", bg: "rgba(255,159,143,0.14)",   color: "#ff9f8f", dot: "#ff9f8f" },
  cancelled:    { label: "اتلغى", bg: "rgba(255,159,143,0.14)",   color: "#ff9f8f", dot: "#ff9f8f" },
};

function OrdersPage() {
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? getGuestToken() : null;
  const call = useServerFn(listMyOrders);
  const refresh = useServerFn(refreshOrder);
  const qc = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", token],
    queryFn: () => call({ data: { token: token! } }),
    enabled: !!token,
  });

  async function onRefresh(orderId: string) {
    if (!token) return;
    await refresh({ data: { token, orderId } });
    qc.invalidateQueries({ queryKey: ["orders", token] });
  }

  return (
    <div className="px-5 pt-8 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 anim-reveal">
        <button
          onClick={() => navigate({ to: "/dashboard/account" })}
          className="glass-pill w-10 h-10 flex items-center justify-center press-scale"
          aria-label="رجوع"
          style={{ color: "#f2f7f3" }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <h1
          className="text-2xl"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}
        >
          طلباتي
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-[color:var(--foreground)] border-b-transparent rounded-full animate-spin opacity-60" />
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="ios-card p-8 text-center space-y-3 anim-reveal">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
             style={{ background: "rgba(255,255,255,0.12)", color: "var(--foreground)" }}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="6" width="16" height="14" rx="2" />
              <path d="M8 6V4h8v2M9 12h6M9 16h4" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: "#f2f7f3" }}>مفيش طلبات لسه</p>
          <p className="text-[13px]" style={{ color: "rgba(242,247,243,0.55)" }}>
            ابدأ أول طلب من صفحة الخدمات
          </p>
          <Link
            to="/dashboard"
            className="ios-btn-primary press-scale inline-flex mt-2"
          >
            شوف الخدمات
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => {
            const st = STATUS_MAP[(o.status || "").toLowerCase()] ?? STATUS_MAP.pending;
            return (
              <div
                key={o.id}
                className="ios-card p-4 space-y-3 anim-reveal"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[14px] leading-snug" style={{ color: "#f2f7f3" }}>
                      {o.service_name}
                    </div>
                    <div
                      className="text-[11px] mt-1 truncate"
                      dir="ltr"
                      style={{ color: "rgba(242,247,243,0.5)" }}
                    >
                      {o.link}
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"
                    style={{ background: st.bg, color: st.color }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: st.dot }}
                    />
                    {st.label}
                  </span>
                </div>

                <div
                  className="flex items-center justify-between text-[12px] pt-3"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(242,247,243,0.6)",
                  }}
                >
                  <span>الكمية {o.quantity.toLocaleString("ar-EG")}</span>
                   <span style={{ color: "var(--foreground)" }}>
                    {Number(o.charge).toFixed(2)} ج.م
                  </span>
                  <span dir="ltr">
                    {new Date(o.created_at).toLocaleDateString("ar-EG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

                <button
                  onClick={() => onRefresh(o.id)}
                  className="text-[12px] font-medium press-scale flex items-center gap-1"
                   style={{ color: "var(--foreground)" }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
                  </svg>
                  حدّث الحالة
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
