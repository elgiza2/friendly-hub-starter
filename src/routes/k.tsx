import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminDeleteItem,
  adminUnlock,
  adminListCatalog,
  adminLock,
  adminLookupService,
  adminSaveItem,
  adminStatus,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/k")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة التحكم | كتالوج الخدمات" },
      { name: "description", content: "تحكم في الخدمات المعروضة في المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const PLATFORMS = [
  { key: "instagram", label: "انستجرام" },
  { key: "tiktok", label: "تيك توك" },
  { key: "facebook", label: "فيسبوك" },
  { key: "youtube", label: "يوتيوب" },
  { key: "telegram", label: "تليجرام" },
  { key: "twitter", label: "تويتر / X" },
] as const;

const CATEGORIES = [
  { key: "followers", label: "متابعين" },
  { key: "likes", label: "لايكات" },
  { key: "views", label: "مشاهدات" },
  { key: "comments", label: "كومنتات" },
  { key: "shares", label: "شير" },
  { key: "reposts", label: "ريبوست" },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];
type CategoryKey = (typeof CATEGORIES)[number]["key"];

function AdminPage() {
  const qc = useQueryClient();
  const status = useServerFn(adminStatus);

  const { data: gate, isLoading } = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => status(),
  });

  if (isLoading) return <Shell>بنحمّل…</Shell>;
  if (!gate?.unlocked) return <Unlock onDone={() => qc.invalidateQueries()} />;
  return <Catalog />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen max-w-[720px] mx-auto px-5 py-10">
      {children}
    </div>
  );
}

function Unlock({ onDone }: { onDone: () => void }) {
  const unlock = useServerFn(adminUnlock);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    const res = await unlock({ data: { password: pw } });
    setBusy(false);
    if (res.ok) onDone();
    else setErr(true);
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-6">لوحة التحكم</h1>
      <form onSubmit={submit} className="ios-card p-5 space-y-3">
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="الباسورد"
          className="w-full h-12 rounded-xl px-4 bg-white/5 border border-white/10 outline-none"
        />
        {err && <p className="text-sm" style={{ color: "#ff8b8b" }}>باسورد غلط</p>}
        <button disabled={busy} className="ios-btn-secondary w-full h-12 rounded-xl">
          {busy ? "…" : "دخول"}
        </button>
      </form>
    </Shell>
  );
}

function Catalog() {
  const qc = useQueryClient();
  const list = useServerFn(adminListCatalog);
  const lookup = useServerFn(adminLookupService);
  const save = useServerFn(adminSaveItem);
  const remove = useServerFn(adminDeleteItem);
  const lock = useServerFn(adminLock);

  const { data } = useQuery({ queryKey: ["admin-catalog"], queryFn: () => list() });

  const [serviceId, setServiceId] = useState("");
  const [platform, setPlatform] = useState<PlatformKey>("instagram");
  const [category, setCategory] = useState<CategoryKey>("followers");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("0");
  const [found, setFound] = useState<null | { name: string; category: string; rate: number; min_quantity: number; max_quantity: number }>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function doLookup() {
    setMsg(null);
    setFound(null);
    const id = Number(serviceId);
    if (!Number.isFinite(id) || id <= 0) return setMsg("اكتب رقم خدمة صحيح");
    const res = await lookup({ data: { serviceId: id } });
    if (!res.ok) return setMsg(res.error ?? "مش لاقيينها");
    setFound(res.service);
    if (!title) setTitle(res.service.name.slice(0, 120));
  }

  async function doSave() {
    setMsg(null);
    const id = Number(serviceId);
    const res = await save({
      data: {
        providerServiceId: id,
        platform,
        category,
        title: title.trim(),
        priceOverride: price.trim() ? Number(price) : null,
        sortOrder: Number(sort) || 0,
        isActive: true,
      },
    });
    if (!res.ok) return setMsg(res.error ?? "مش اتحفظت");
    setMsg("اتحفظت ✓");
    setServiceId("");
    setTitle("");
    setPrice("");
    setFound(null);
    qc.invalidateQueries({ queryKey: ["admin-catalog"] });
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">كتالوج الخدمات</h1>
        <button
          className="text-sm opacity-70"
          onClick={async () => {
            await lock();
            qc.invalidateQueries();
          }}
        >
          خروج
        </button>
      </div>

      <section className="ios-card p-5 space-y-3 mb-8">
        <div className="font-medium">إضافة / تعديل خدمة</div>

        <div className="flex gap-2">
          <input
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            placeholder="رقم الخدمة عند المزوّد"
            inputMode="numeric"
            className="flex-1 h-12 rounded-xl px-4 bg-white/5 border border-white/10 outline-none"
          />
          <button onClick={doLookup} className="ios-btn-secondary h-12 px-5 rounded-xl">
            بحث
          </button>
        </div>

        {found && (
          <div className="text-xs opacity-70 leading-relaxed">
            {found.name}
            <br />
            تكلفة المزوّد: {found.rate.toFixed(4)}$ / 1000 · الحد {found.min_quantity} - {found.max_quantity}
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="الاسم اللي هيظهر للعميل"
          className="w-full h-12 rounded-xl px-4 bg-white/5 border border-white/10 outline-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as PlatformKey)}
            className="h-12 rounded-xl px-3 bg-white/5 border border-white/10 outline-none"
          >
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key} className="text-black">
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryKey)}
            className="h-12 rounded-xl px-3 bg-white/5 border border-white/10 outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key} className="text-black">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="سعر ثابت بالدولار /1000 (اختياري)"
            inputMode="decimal"
            className="h-12 rounded-xl px-4 bg-white/5 border border-white/10 outline-none"
          />
          <input
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            placeholder="الترتيب"
            inputMode="numeric"
            className="h-12 rounded-xl px-4 bg-white/5 border border-white/10 outline-none"
          />
        </div>

        <button onClick={doSave} className="ios-btn-secondary w-full h-12 rounded-xl">
          حفظ
        </button>
        {msg && <p className="text-sm opacity-80">{msg}</p>}
      </section>

      <div className="space-y-2">
        <div className="text-sm opacity-60">
          {data?.items.length ?? 0} خدمة في الكتالوج
          {(data?.items.length ?? 0) === 0 && " — لو فاضي، المتجر بيعرض الخدمات تلقائيًا"}
        </div>
        {data?.items.map((i) => (
          <div key={i.id} className="ios-card p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{i.title}</div>
              <div className="text-[11px] opacity-60">
                #{i.provider_service_id} ·{" "}
                {PLATFORMS.find((p) => p.key === i.platform)?.label ?? i.platform} ·{" "}
                {CATEGORIES.find((c) => c.key === i.category)?.label ?? i.category}
                {i.price_override ? ` · سعر ثابت ${Number(i.price_override)}$` : ""}
              </div>
            </div>
            <button
              onClick={async () => {
                await remove({ data: { id: i.id } });
                qc.invalidateQueries({ queryKey: ["admin-catalog"] });
              }}
              className="text-xs opacity-70"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </Shell>
  );
}
