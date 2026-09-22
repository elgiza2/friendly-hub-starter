import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getMe, listMyTransactions } from "@/lib/smm.functions";
import { createDepositIntent, getDepositStatus } from "@/lib/kashier.functions";
import { getGuestToken } from "@/lib/guest-session";
import { z } from "zod";

export const Route = createFileRoute("/dashboard/wallet")({
  validateSearch: (s) => z.object({ deposit: z.string().optional() }).parse(s),
  component: WalletPage,
});

function WalletPage() {
  const token = typeof window !== "undefined" ? getGuestToken() : null;
  const fetchMe = useServerFn(getMe);
  const fetchTx = useServerFn(listMyTransactions);
  const startDeposit = useServerFn(createDepositIntent);
  const checkDeposit = useServerFn(getDepositStatus);
  const search = Route.useSearch();
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["me", token],
    queryFn: () => fetchMe({ data: { token: token! } }),
    enabled: !!token,
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions", token],
    queryFn: () => fetchTx({ data: { token: token! } }),
    enabled: !!token,
  });

  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Reconcile after Kashier redirects the user back with ?deposit=<orderId>
  useEffect(() => {
    if (!search.deposit) return;
    let cancelled = false;
    let tries = 0;
    const orderId = search.deposit;
    const poll = async () => {
      tries++;
      const res = await checkDeposit({ data: { orderId } });
      if (cancelled) return;
      if (res?.status === "completed") {
        setStatusMsg("تم شحن رصيدك بنجاح ✅");
        qc.invalidateQueries({ queryKey: ["me", token] });
        qc.invalidateQueries({ queryKey: ["transactions", token] });
        return;
      }
      if (tries < 8) setTimeout(poll, 1500);
      else setStatusMsg("لسه بننتظر تأكيد الدفع… لو اتخصم من حسابك هيتحدث خلال دقائق.");
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [search.deposit]);

  async function handlePay() {
    if (!token || amount < 10) return;
    setLoading(true);
    try {
      const { url } = await startDeposit({
        data: { token, amount, redirectOrigin: window.location.origin },
      });
      window.location.href = url;
    } catch (e: any) {
      setLoading(false);
      setStatusMsg(e?.message ?? "معرفناش نبدأ الدفع");
    }
  }


  return (
    <div className="px-5 pt-8 space-y-5">
      <div className="anim-rise">
        <h1
          className="text-3xl"
          style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}
        >
          المحفظة
        </h1>
      </div>

      {/* Balance card */}
      <div className="ios-card p-7 text-center anim-reveal" style={{ animationDelay: "0.08s" }}>
        <div className="text-sm" style={{ color: "rgba(242,247,243,0.55)" }}>
          رصيدك دلوقتي
        </div>
        <div className="mt-3 flex items-baseline justify-center gap-2">
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              fontSize: 52,
              color: "#f2f7f3",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {Number(me?.balance ?? 0).toFixed(2)}
          </span>
          <span className="text-lg" style={{ color: "rgba(242,247,243,0.55)" }}>ج.م</span>
        </div>
      </div>

      {/* Deposit button */}
      <button
        onClick={() => setDepositOpen(true)}
        className="ios-btn-primary press-scale w-full flex items-center justify-center gap-2 anim-reveal"
        style={{ animationDelay: "0.16s" }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        إيداع رصيد
      </button>

      {/* Transactions list */}
      <div className="anim-reveal" style={{ animationDelay: "0.24s" }}>
        <h2 className="text-base font-semibold mb-3 px-1" style={{ color: "rgba(242,247,243,0.85)" }}>
          حركة الفلوس
        </h2>
        {!transactions || transactions.length === 0 ? (
          <div className="ios-card p-6 text-center text-sm" style={{ color: "rgba(242,247,243,0.55)" }}>
            مفيش أي معاملات لحد دلوقتي.
          </div>
        ) : (
          <div className="ios-list">
            {transactions.map((tx, i, arr) => {
              const isCredit = Number(tx.amount) > 0;
              const isOrder = tx.type === "order";
              const label = isOrder
                ? "طلب خدمة"
                : tx.type === "deposit"
                ? "إيداع"
                : tx.type === "refund"
                ? "استرداد"
                : tx.type;
              return (
                <div key={tx.id} className={`ios-row ${i === arr.length - 1 ? "ios-row-last" : ""}`}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                       background: isCredit ? "rgba(255,255,255,0.12)" : "rgba(255,159,143,0.14)",
                       color: isCredit ? "var(--foreground)" : "var(--destructive)",
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      {isCredit ? <path d="M12 5v14M5 12h14" /> : <path d="M5 12h14" />}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate flex items-center gap-2" style={{ color: "#f2f7f3" }}>
                      {label}
                      {tx.type === "deposit" && tx.status !== "completed" && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: tx.status === "failed" ? "rgba(255,159,143,0.14)" : "rgba(255,255,255,0.08)",
                            color: tx.status === "failed" ? "var(--destructive)" : "rgba(242,247,243,0.6)",
                          }}
                        >
                          ملغي
                        </span>
                      )}
                    </div>
                    <div className="text-[11px]" style={{ color: "rgba(242,247,243,0.5)" }}>
                      {new Date(tx.created_at).toLocaleDateString("ar-EG", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div
                    className="text-left font-bold text-[15px] shrink-0"
                    dir="ltr"
                     style={{ color: isCredit ? "var(--foreground)" : "var(--destructive)" }}
                  >
                    {isCredit ? "+" : ""}
                    {Number(tx.amount).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status banner after redirect */}
      {statusMsg && (
        <div className="ios-card p-4 text-center text-sm" style={{ color: "#f2f7f3" }}>
          {statusMsg}
        </div>
      )}

      {/* Deposit sheet */}
      {depositOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
           style={{ background: "rgba(7,8,10,0.28)", backdropFilter: "blur(14px)" }}
          onClick={() => !loading && setDepositOpen(false)}
        >
          <div
            className="w-full max-w-[520px] px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+26px)]"
            style={{
               background: "rgba(18,20,24,0.58)",
               borderTop: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "30px 30px 0 0",
              backdropFilter: "blur(24px) saturate(150%)",
              animation: "fadeRise 0.35s cubic-bezier(0.16,1,0.3,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-10 h-1 rounded-full mx-auto mb-5"
              style={{ background: "rgba(255,255,255,0.18)" }}
            />

            <h3 className="text-[22px] font-semibold tracking-tight text-center">إيداع رصيد</h3>
            <p className="text-center text-[12px] mt-1.5 mb-6" style={{ color: "var(--muted-foreground)" }}>
              فيزا · ماستركارد · ميزة · فودافون كاش
            </p>

            <div className="ios-card px-5 py-5">
              <div className="text-[12px] text-center" style={{ color: "var(--muted-foreground)" }}>
                المبلغ بالجنيه
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={10}
                max={50000}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full mt-2 bg-transparent outline-none text-center text-[38px] font-semibold tracking-tight"
                style={{ color: "var(--foreground)" }}
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              {[50, 100, 200, 500].map((v) => {
                const active = amount === v;
                return (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className="py-2.5 text-[14px] font-medium press-scale"
                    style={{
                      borderRadius: 999,
                       background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
                       border: `1px solid ${active ? "rgba(255,255,255,0.48)" : "rgba(255,255,255,0.12)"}`,
                      color: active ? "var(--accent-foreground)" : "var(--foreground)",
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handlePay}
              disabled={loading || amount < 10}
              className="ios-btn-primary press-scale w-full mt-5 disabled:opacity-50"
            >
              {loading ? "جارٍ التحويل…" : `ادفع ${amount.toFixed(2)} ج.م`}
            </button>
            <button
              onClick={() => setDepositOpen(false)}
              disabled={loading}
              className="ios-btn-secondary press-scale w-full mt-2.5"
            >
              اقفل
            </button>
            <p className="text-center text-[11px] mt-4" style={{ color: "rgba(242,247,243,0.35)" }}>
              من 10 ج.م لـ 50,000 ج.م
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
