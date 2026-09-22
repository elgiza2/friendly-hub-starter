import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Heart, MessageCircle, Users, Repeat2, Share2, Eye, Sparkles, ChevronLeft } from "lucide-react";
import { getMe, listServices } from "@/lib/smm.functions";
import { getUsdEgpRate } from "@/lib/fx.functions";
import { getGuestToken } from "@/lib/guest-session";
import { PLATFORMS, type PlatformKey } from "@/lib/platform-icons";
import { CATEGORY_LABEL, CATEGORY_ORDER, curate, type CategoryKey } from "@/lib/service-taxonomy";

export const Route = createFileRoute("/dashboard/")({
  component: HomePage,
});

const CAT_ICON: Record<CategoryKey, typeof Heart> = {
  likes: Heart,
  comments: MessageCircle,
  followers: Users,
  reposts: Repeat2,
  shares: Share2,
  views: Eye,
  other: Sparkles,
};

function HomePage() {
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? getGuestToken() : null;

  const fetchMe = useServerFn(getMe);
  const { data: me } = useQuery({
    queryKey: ["me", token],
    queryFn: () => fetchMe({ data: { token: token! } }),
    enabled: !!token,
  });

  const fetchServices = useServerFn(listServices);
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => fetchServices(),
    staleTime: 60_000,
  });

  const fetchFx = useServerFn(getUsdEgpRate);
  const { data: fx } = useQuery({
    queryKey: ["fx-usd-egp"],
    queryFn: () => fetchFx(),
    staleTime: 60 * 60_000,
  });
  const fxRate = fx?.rate ?? 48.5;

  const [platform, setPlatform] = useState<PlatformKey | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  // Group all services by the platform we verified on the server
  const byPlatform = useMemo(() => {
    const items = services?.services ?? [];
    const map = new Map<PlatformKey, typeof items>();
    for (const s of items) {
      const p = s.platform as PlatformKey;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(s);
    }
    return map;
  }, [services]);

  // For the selected platform, split by our own category keys
  const byCategory = useMemo(() => {
    const platformItems = platform ? byPlatform.get(platform) ?? [] : [];
    const map = new Map<string, typeof platformItems>();
    for (const s of platformItems) {
      if (!map.has(s.cat)) map.set(s.cat, []);
      map.get(s.cat)!.push(s);
    }
    return map;
  }, [platform, byPlatform]);

  const dynamicCategories = useMemo(() => {
    return CATEGORY_ORDER.filter((key) => (byCategory.get(key)?.length ?? 0) > 0).map((key) => {
      const list = byCategory.get(key)!;
      const label =
        key === "followers" && platform === "youtube" ? "مشتركين" : CATEGORY_LABEL[key];
      return {
        raw: key as string,
        kind: key,
        label,
        cheapestRate: Math.min(...list.map((s) => Number(s.rate))),
      };
    });
  }, [byCategory, platform]);

  const curated = useMemo(() => {
    if (!platform || !category) return [];
    return curate(byCategory.get(category) ?? [], category as CategoryKey);
  }, [platform, category, byCategory]);

  const currentPlatform = platform ? PLATFORMS.find((p) => p.key === platform)! : null;
  const currentCategory = category
    ? {
        raw: category,
        label:
          category === "followers" && platform === "youtube"
            ? "مشتركين"
            : CATEGORY_LABEL[category as CategoryKey],
        kind: category as CategoryKey,
      }
    : null;

  return (
    <div className="relative">
      {/* Clean header — no media */}
      <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+30px)] pb-1 anim-rise">
        <h1
          className="text-[30px] leading-[1.15] font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          أهلاً، <span style={{ color: "var(--accent-foreground)" }}>{me?.name ?? "بيك"}</span>
        </h1>

        <div className="ios-card mt-5 px-5 py-4 flex items-center justify-between">
          <div className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
            رصيدك
          </div>
          <div className="flex items-end gap-1.5">
            <span className="text-[26px] font-semibold tracking-tight leading-none">
              {Number(me?.balance ?? 0).toFixed(2)}
            </span>
            <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              ج.م
            </span>
          </div>
        </div>
      </header>



      <div className="px-5 pt-5 space-y-5">
        {/* STEP 1: platform */}
        {!platform && (
          <section>
            <h2 className="text-xl mb-4" style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}>
              اختار المنصة
            </h2>
            <div className="space-y-2.5">
              {PLATFORMS.map((p, i) => {
                const disabled = !isLoading && (byPlatform.get(p.key)?.length ?? 0) === 0;
                return (
                  <button
                    key={p.key}
                    onClick={() => !disabled && setPlatform(p.key)}
                    disabled={disabled}
                    className="ios-card w-full px-4 py-3.5 flex items-center gap-3.5 text-right press-scale anim-reveal disabled:opacity-40"
                    style={{ animationDelay: `${0.06 + i * 0.04}s` }}
                  >
                    <p.Icon width={34} height={34} />
                    <div className="flex-1 text-[15px] font-medium" style={{ color: "#f2f7f3" }}>
                      {p.label}
                    </div>
                    <ChevronLeft className="w-4 h-4 opacity-35" />
                  </button>
                );
              })}
            </div>

            {isLoading && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-[color:var(--foreground)] border-b-transparent rounded-full animate-spin opacity-60" />
              </div>
            )}
            {!isLoading && services && !services.ok && (
              <div className="ios-card p-4 mt-4 text-center text-sm" style={{ color: "rgba(242,247,243,0.7)" }}>
                معرفناش نحمل الخدمات دلوقتي.
              </div>
            )}
          </section>
        )}

        {/* STEP 2: category */}
        {platform && !category && (
          <section key={platform} className="anim-reveal">
            <div className="flex items-center gap-3 mb-5">
              <BackButton onClick={() => setPlatform(null)} />
              {currentPlatform && <currentPlatform.Icon width={40} height={40} />}
              <div className="flex-1">
                <div className="font-semibold text-lg">{currentPlatform?.label}</div>
                <div className="text-xs" style={{ color: "rgba(242,247,243,0.55)" }}>
                  اختار القسم
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {dynamicCategories.map((c) => {
                const Icon = CAT_ICON[c.kind];
                return (
                  <button
                    key={c.raw}
                    onClick={() => setCategory(c.raw)}
                    className="ios-card p-5 min-h-[122px] flex flex-col items-center justify-center gap-2 press-scale"
                  >
                    <Icon className="w-7 h-7" strokeWidth={1.8} style={{ color: "var(--accent-foreground)" }} />
                    <div className="text-[14px] leading-snug font-medium text-center">{c.label}</div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* STEP 3: curated services */}
        {platform && category && (
          <section key={`${platform}-${category}`} className="anim-reveal">
            <div className="flex items-center gap-3 mb-4">
              <BackButton onClick={() => setCategory(null)} />
              {currentPlatform && <currentPlatform.Icon width={40} height={40} />}
              <div className="flex-1">
                <div className="font-semibold text-lg">
                  {currentCategory?.label} {currentPlatform?.label}
                </div>
                <div className="text-xs opacity-60">السعر بالجنيه لكل 1000</div>
              </div>
            </div>

            {curated.length === 0 ? (
              <div className="ios-card p-6 text-center text-sm opacity-70">
                مفيش خدمات متاحة دلوقتي.
              </div>
            ) : (
              <div className="space-y-2.5">
                {curated.map((s) => {
                  const egp = s.rateNum * fxRate;
                  const serviceTitle = s.name;
                  return (
                    <button
                      key={s.service}
                      onClick={() =>
                        navigate({
                          to: "/dashboard/order/$serviceId",
                          params: { serviceId: String(s.service) },
                        })
                      }
                      className="ios-card w-full p-4 text-right press-scale flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[14px] leading-snug">{serviceTitle}</div>
                        <div className="text-[11px] mt-1 opacity-55">
                          من {s.min.toLocaleString()} لـ {s.max.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="font-bold text-lg" style={{ color: "var(--accent-foreground)" }}>
                          {egp.toFixed(2)}
                        </div>
                        <div className="text-[10px] opacity-55">ج.م / 1000</div>
                      </div>
                      <ChevronLeft className="w-4 h-4 shrink-0 opacity-40" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-pill w-10 h-10 flex items-center justify-center press-scale"
      aria-label="رجوع"
    >
      <ChevronLeft className="w-5 h-5" style={{ transform: "scaleX(-1)" }} />
    </button>
  );
}
