import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight, Info, AlertCircle, Link as LinkIcon, Hash, Wallet } from "lucide-react";
import { listServices, placeOrder, getMe } from "@/lib/smm.functions";
import { getUsdEgpRate } from "@/lib/fx.functions";
import { getGuestToken } from "@/lib/guest-session";
import { attrsOf, categoryOf } from "@/lib/service-taxonomy";
import { detectPlatform, PLATFORMS } from "@/lib/platform-icons";
import { getInstructions } from "@/lib/service-instructions";

export const Route = createFileRoute("/dashboard/order/$serviceId")({
  component: OrderPage,
});

function OrderPage() {
  const { serviceId } = Route.useParams();
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? getGuestToken() : null;

  const call = useServerFn(listServices);
  const submit = useServerFn(placeOrder);
  const fetchMe = useServerFn(getMe);
  const fetchFx = useServerFn(getUsdEgpRate);

  const { data, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => call(),
    staleTime: 60_000,
  });
  const { data: fx } = useQuery({
    queryKey: ["fx-usd-egp"],
    queryFn: () => fetchFx(),
    staleTime: 60 * 60_000,
  });
  const { data: me } = useQuery({
    queryKey: ["me", token],
    queryFn: () => fetchMe({ data: { token: token! } }),
    enabled: !!token,
  });
  const fxRate = fx?.rate ?? 48.5;

  const service = useMemo(
    () => data?.services.find((s) => String(s.service) === serviceId),
    [data, serviceId],
  );

  const [link, setLink] = useState("");
  const [qty, setQty] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rateUsd = service ? Number(service.rate) : 0;
  const ratePer1000Egp = rateUsd * fxRate;
  const quantity = Number(qty) || 0;
  const min = service ? Number(service.min) : 0;
  const max = service ? Number(service.max) : 0;
  const chargeEgp = +(ratePer1000Egp * (quantity / 1000)).toFixed(2);
  const balance = Number(me?.balance ?? 0);

  const meta = service
    ? {
        cat: categoryOf(`${service.category} ${service.name}`),
        attrs: attrsOf(service.name),
        platform: detectPlatform(`${service.category} ${service.name}`),
      }
    : null;
  const platformInfo = meta?.platform ? PLATFORMS.find((p) => p.key === meta.platform) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[color:var(--foreground)] border-b-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="px-5 pt-6">
        <div className="ios-card p-6 text-center space-y-3">
          <p className="font-medium">الخدمة دي مش موجودة</p>
          <button onClick={() => navigate({ to: "/dashboard" })} className="ios-btn-secondary press-scale inline-flex">
            ارجع للخدمات
          </button>
        </div>
      </div>
    );
  }

  const canSubmit =
    link.trim().length > 5 &&
    quantity >= min &&
    quantity <= max &&
    !busy &&
    chargeEgp <= balance;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    if (!token) { navigate({ to: "/" }); return; }
    setErr(null);
    setBusy(true);
    try {
      const res = await submit({
        data: {
          token,
          serviceId: service.service,
          serviceName: service.name,
          category: service.category,
          link: link.trim(),
          quantity,
          charge: chargeEgp,
        },
      });
      if (!res.ok) { setErr(res.error); return; }
      navigate({ to: "/dashboard/orders" });
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const label = service.name;

  const instr = getInstructions(meta?.platform ?? null, meta?.cat ?? "other");

  return (
    <div className="px-5 pt-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="glass-pill w-10 h-10 flex items-center justify-center press-scale"
          aria-label="رجوع"
          style={{ color: "var(--foreground)" }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        {platformInfo && <platformInfo.Icon width={44} height={44} />}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] truncate">{label}</div>
          <div className="text-[11px] opacity-70">{platformInfo?.label ?? service.category}</div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Price card */}
        <div className="ios-card p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-sm opacity-70">سعر الخدمة</div>
            <div className="text-left">
              <div className="text-3xl font-bold" style={{ color: "var(--accent-foreground)" }}>
                {ratePer1000Egp.toFixed(2)}
              </div>
              <div className="text-[11px] opacity-60">ج.م لكل 1000</div>
            </div>
          </div>
          <div className="border-t mt-4 pt-3 flex items-center justify-between text-[12px] opacity-70" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <span>أقل كمية: <span className="font-medium opacity-100">{min.toLocaleString()}</span></span>
            <span>أكبر كمية: <span className="font-medium opacity-100">{max.toLocaleString()}</span></span>
          </div>
        </div>

        {/* Instructions card — service specific */}
        <div className="ios-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4" style={{ color: "var(--accent-foreground)" }} />
            <div className="text-[13px] font-semibold">إزاي تجيب اللينك الصح؟</div>
          </div>
          <ol className="space-y-2 text-[13px] leading-relaxed opacity-90">
            {instr.steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className="shrink-0 w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-semibold"
                  style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                >
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {instr.warn && (
            <div className="mt-3 flex items-center gap-2 text-[12px] px-3 py-2 rounded-xl" style={{ background: "rgba(255,180,120,0.08)", color: "#f5b769" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{instr.warn}</span>
            </div>
          )}
        </div>

        {/* Link input */}
        <div>
          <label className="flex items-center gap-2 text-[13px] mb-2 px-1 opacity-80">
            <LinkIcon className="w-3.5 h-3.5" /> {instr.linkLabel}
          </label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={instr.linkPlaceholder}
            className="ios-input"
            dir="ltr"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="flex items-center gap-2 text-[13px] mb-2 px-1 opacity-80">
            <Hash className="w-3.5 h-3.5" /> الكمية اللي محتاجها
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder={`من ${min} لـ ${max}`}
            className="ios-input"
            min={min}
            max={max}
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {[100, 500, 1000, 5000, 10000].filter((n) => n >= min && n <= max).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQty(String(n))}
                className="glass-pill px-3 py-1.5 text-[12px] press-scale"
              >
                {n.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="ios-card p-4">
          <div className="flex items-center justify-between">
            <span className="opacity-75">المجموع</span>
            <span className="font-bold text-2xl" style={{ color: "var(--accent-foreground)" }}>
              {chargeEgp.toFixed(2)}
              <span className="text-xs font-normal mr-1 opacity-60">ج.م</span>
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] opacity-60">
            <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> رصيدك</span>
            <span>{balance.toFixed(2)} ج.م</span>
          </div>
          {chargeEgp > balance && quantity > 0 && (
            <div className="mt-3 text-[12px] text-center" style={{ color: "#ff9f8f" }}>
              رصيدك مش كافي. اشحن محفظتك الأول.
            </div>
          )}
        </div>

        {err && <p className="text-sm text-center" style={{ color: "#ff9f8f" }}>{err}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="ios-btn-primary press-scale w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? "بنرسل الطلب..." : "اطلب دلوقتي"}
        </button>
      </form>
    </div>
  );
}
