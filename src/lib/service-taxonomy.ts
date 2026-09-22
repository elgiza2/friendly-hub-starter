// Client-safe helpers to categorize and curate SMM services.

export type CategoryKey =
  | "followers"
  | "likes"
  | "comments"
  | "views"
  | "shares"
  | "reposts"
  | "other";

export const CATEGORIES: { key: CategoryKey; label: string; match: RegExp }[] = [
  { key: "likes",     label: "لايكات",   match: /\blikes?\b|reaction|إعجاب|اعجاب|لايك/i },
  { key: "comments",  label: "كومنتات",  match: /\bcomments?\b|reply|تعليق|comment\s*like/i },
  { key: "followers", label: "متابعين",  match: /follow|subscriber|member|subscrib|join|متابع|مشترك|أعضاء|اعضاء/i },
  { key: "reposts",   label: "ريبوست",   match: /repost|retweet|reblog|إعادة\s*نشر|اعادة\s*نشر|ريبوست|ريتويت/i },
  { key: "shares",    label: "شير",      match: /\bshares?\b|share\b|مشارك|شير/i },
  { key: "views",     label: "مشاهدات",  match: /\bviews?\b|impress|reach|watch|play|stream|مشاهد/i },
  { key: "other",     label: "خدمات تانية", match: /.*/ },
];

export function categoryOf(text: string): CategoryKey {
  for (const c of CATEGORIES) if (c.key !== "other" && c.match.test(text)) return c.key;
  return "other";
}

export interface ServiceAttrs {
  refill: boolean;   // إعادة تعويض
  stable: boolean;   // ثابت / لا ينقص
  arab: boolean;     // عرب
  real: boolean;     // real / حقيقي
  cheap: boolean;    // cheap / رخيص
  fast: boolean;     // fast / سريع
}

export function attrsOf(name: string): ServiceAttrs {
  const t = name.toLowerCase();
  return {
    refill: /refill|guarantee|guaranteed|warrant|ضمان|تعويض/i.test(t),
    stable: /stable|non[\s-]?drop|no[\s-]?drop|permanent|lifetime|ثابت|لا\s*ينقص|دائم|بدون\s*نقص/i.test(t),
    arab:   /\barab|gulf|egypt|khaleej|عرب|مصر|مصري|خليج|سعودي|إمارات|امارات/i.test(t),
    real:   /real|genuine|حقيق/i.test(t),
    cheap:  /cheap|رخيص|اقتصاد/i.test(t),
    fast:   /fast|speed|instant|سريع|فوري/i.test(t),
  };
}

/** Human label for a service grouping badge. */
export function attrLabel(a: ServiceAttrs, cat: CategoryKey): string {
  const noun =
    cat === "followers" ? "متابعين" :
    cat === "likes"     ? "لايكات" :
    cat === "comments"  ? "كومنتات" :
    cat === "views"     ? "مشاهدات" :
    cat === "shares"    ? "شير" :
    cat === "reposts"   ? "ريبوست" : "خدمة تانية";

  const parts: string[] = [noun];
  if (a.arab) parts.push("عرب");
  if (a.stable && a.refill) parts.push("ثابت + تعويض");
  else if (a.stable) parts.push("ثابت");
  else if (a.refill) parts.push("مع تعويض");
  else parts.push("عادي");
  if (a.real) parts.push("حقيقي");
  if (a.fast) parts.push("سريع");
  return parts.join(" · ");
}

const SMM_TRANSLATIONS: [RegExp, string][] = [
  [/\binstagram\b|\binsta\b|\big\b/gi, "انستجرام"],
  [/\btik\s*tok\b|\btiktok\b/gi, "تيك توك"],
  [/\bfacebook\b|\bfb\b/gi, "فيسبوك"],
  [/\byoutube\b|\byt\b/gi, "يوتيوب"],
  [/\btelegram\b|\btg\b/gi, "تليجرام"],
  [/\btwitter\b|\bx\s*\(twitter\)|\btweets?\b/gi, "X"],
  [/\bfollowers?\b/gi, "متابعين"],
  [/\bsubscribers?\b/gi, "مشتركين"],
  [/\bmembers?\b/gi, "أعضاء"],
  [/\blikes?\b/gi, "لايكات"],
  [/\bcomments?\b/gi, "كومنتات"],
  [/\bviews?\b/gi, "مشاهدات"],
  [/\bshares?\b/gi, "شير"],
  [/\breposts?\b|\bretweets?\b/gi, "ريبوست"],
  [/\breactions?\b/gi, "ريأكشن"],
  [/\bsaves?\b/gi, "حفظ"],
  [/\bstory\b|\bstories\b/gi, "ستوري"],
  [/\breels?\b/gi, "ريلز"],
  [/\bvideo\b|\bvideos\b/gi, "فيديو"],
  [/\bprofile\b/gi, "بروفايل"],
  [/\bpage\b/gi, "صفحة"],
  [/\bchannel\b/gi, "قناة"],
  [/\bgroup\b/gi, "جروب"],
  [/\blive\b/gi, "لايف"],
  [/\bwatch\s*time\b/gi, "وقت مشاهدة"],
  [/\bhigh\s*quality\b|\bhq\b/gi, "جودة عالية"],
  [/\breal\b/gi, "حقيقي"],
  [/\barab\b|\begypt\b|\begyptian\b|\bgulf\b/gi, "عرب"],
  [/\bfast\b|\binstant\b/gi, "سريع"],
  [/\bcheap\b/gi, "رخيص"],
  [/\brefill\b|\bguaranteed?\b|\bguarantee\b/gi, "تعويض"],
  [/\bnon[\s-]?drop\b|\bno[\s-]?drop\b|\bstable\b/gi, "ثابت"],
];

function polishExternalText(text: string): string {
  let value = text
    .replace(/[✅🔥🚀⭐💎⚡️✨]+/g, " ")
    .replace(/[\[\](){}]/g, " ")
    .replace(/\s*[|/\\]+\s*/g, " · ")
    .replace(/\s*-\s*/g, " · ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of SMM_TRANSLATIONS) {
    value = value.replace(pattern, replacement);
  }

  return value.replace(/\s+/g, " ").trim() || text;
}

export function displayProviderCategory(category: string): string {
  return cleanCategoryName(category);
}

/** Percentage added on top of the provider cost. */
export const PROFIT_MULTIPLIER = 1.5;

const PLATFORM_LABELS: [RegExp, string][] = [
  [/instagram|\binsta\b|\big\b/i, "انستجرام"],
  [/tik\s*tok/i, "تيك توك"],
  [/facebook|\bfb\b/i, "فيسبوك"],
  [/youtube|\byt\b/i, "يوتيوب"],
  [/telegram/i, "تليجرام"],
  [/twitter|\bx\.com\b|\btweet/i, "تويتر"],
  [/snapchat/i, "سناب شات"],
  [/spotify/i, "سبوتيفاي"],
  [/soundcloud/i, "ساوند كلاود"],
  [/twitch/i, "تويتش"],
  [/linkedin/i, "لينكد إن"],
  [/threads/i, "ثريدز"],
  [/discord/i, "ديسكورد"],
  [/whatsapp/i, "واتساب"],
  [/website\s*traffic/i, "زيارات موقع"],
];

function platformLabelOf(text: string): string | null {
  for (const [re, label] of PLATFORM_LABELS) if (re.test(text)) return label;
  return null;
}

const NOUN: Record<CategoryKey, string> = {
  followers: "متابعين",
  likes: "لايكات",
  comments: "كومنتات",
  views: "مشاهدات",
  shares: "شير",
  reposts: "ريبوست",
  other: "خدمة",
};

/** Short, clean Arabic category label. */
export function cleanCategoryName(category: string): string {
  const plat = platformLabelOf(category);
  const noun = NOUN[categoryOf(category)];
  return plat ? `${noun} ${plat}` : polishExternalText(category);
}

/**
 * Build a short, clean Arabic service name out of the provider's noisy title.
 * Example: "TikTok Followers | NEW | Cheapest | Speed: 20K/Day | No Refill | MAX 300K"
 *        → "متابعين تيك توك · اقتصادي · سرعة 20K/يوم"
 */
export function cleanServiceName(rawName: string, rawCategory = ""): string {
  const src = `${rawName} ${rawCategory}`;
  const noun = NOUN[categoryOf(src)];
  const plat = platformLabelOf(src);
  const a = attrsOf(src);

  const head = plat ? `${noun} ${plat}` : noun;
  const tags: string[] = [];

  if (a.arab) tags.push("عرب");
  if (a.real) tags.push("حقيقي");
  if (a.stable) tags.push("ثابت");

  const refillDays = /refill[^0-9a-z]{0,12}(\d{1,4})\s*days?/i.exec(rawName);
  if (refillDays) tags.push(`تعويض ${refillDays[1]} يوم`);
  else if (a.refill) tags.push("تعويض");

  if (a.fast) tags.push("سريع");
  else if (a.cheap) tags.push("اقتصادي");

  const speed = /speed[^0-9]{0,14}(\d+(?:\.\d+)?\s*[kmKM]?)(?:\s*-\s*\d+(?:\.\d+)?\s*[kmKM]?)?\s*\/?\s*day/i.exec(
    rawName,
  );
  if (speed) tags.push(`سرعة ${speed[1].replace(/\s+/g, "").toUpperCase()}/يوم`);

  const out = tags.length ? `${head} · ${tags.slice(0, 4).join(" · ")}` : head;
  return out.trim() || polishExternalText(rawName);
}

export function displayServiceName(name: string, fallbackCategory = ""): string {
  return cleanServiceName(name || fallbackCategory, fallbackCategory);
}

export interface RawService {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
}

export interface CuratedService extends RawService {
  attrs: ServiceAttrs;
  bucket: string; // grouping key by attrs
  label: string;
  rateNum: number;
}

/** Bucket key so we can dedupe/diversify across attribute combinations. */
function bucketKey(a: ServiceAttrs): string {
  return [
    a.arab ? "arab" : "any",
    a.stable ? "stable" : "drop",
    a.refill ? "refill" : "norefill",
  ].join("|");
}

/** Rank order: prefer stable+refill, then stable, then refill, then base; arab bumps up. */
function bucketRank(a: ServiceAttrs): number {
  let r = 0;
  if (a.stable && a.refill) r += 4;
  else if (a.stable) r += 3;
  else if (a.refill) r += 2;
  else r += 1;
  if (a.arab) r += 0.5;
  return r;
}

/**
 * Curate a list of raw services for a platform+category:
 * - Filter out absurdly expensive or malformed rates
 * - Group by bucket (arab × stable × refill)
 * - Keep the cheapest few in each bucket
 * - Sort final list: best buckets first, cheapest first
 */
export function curate(
  raw: RawService[],
  cat: CategoryKey,
  opts: { maxPerBucket?: number; maxTotal?: number } = {},
): CuratedService[] {
  const perBucket = opts.maxPerBucket ?? 2;
  const total = opts.maxTotal ?? 12;

  const enriched: CuratedService[] = raw
    .map((s) => {
      const a = attrsOf(s.name);
      const rateNum = Number(s.rate);
      return {
        ...s,
        attrs: a,
        bucket: bucketKey(a),
        label: attrLabel(a, cat),
        rateNum,
      };
    })
    .filter((s) => Number.isFinite(s.rateNum) && s.rateNum > 0 && s.rateNum < 500);

  // Group by bucket
  const groups = new Map<string, CuratedService[]>();
  for (const s of enriched) {
    if (!groups.has(s.bucket)) groups.set(s.bucket, []);
    groups.get(s.bucket)!.push(s);
  }

  // Cheapest per bucket
  const picked: CuratedService[] = [];
  for (const [, list] of groups) {
    list.sort((a, b) => a.rateNum - b.rateNum);
    picked.push(...list.slice(0, perBucket));
  }

  // Drop duplicate display names, keeping the cheapest of each.
  const seen = new Map<string, CuratedService>();
  for (const s of picked.sort((a, b) => a.rateNum - b.rateNum)) {
    if (!seen.has(s.name)) seen.set(s.name, s);
  }
  picked.length = 0;
  picked.push(...seen.values());

  // Sort: bucket rank desc, then price asc
  picked.sort((a, b) => {
    const rb = bucketRank(b.attrs) - bucketRank(a.attrs);
    if (rb !== 0) return rb;
    return a.rateNum - b.rateNum;
  });

  return picked.slice(0, total);
}

// ─────────────────────────────────────────────────────────────
// Strict classification: only well-understood services are shown.
// ─────────────────────────────────────────────────────────────

export type StrictPlatform =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "youtube"
  | "telegram"
  | "twitter";

const STRICT_PLATFORM: [StrictPlatform, RegExp][] = [
  ["instagram", /\binstagram\b|\binsta\b|\bigtv\b/i],
  ["tiktok", /\btik\s?tok\b|\btiktok\b/i],
  ["facebook", /\bfacebook\b|\bfb\b/i],
  ["youtube", /\byoutube\b|\byt\b|\bshorts\b/i],
  ["telegram", /\btelegram\b/i],
  ["twitter", /\btwitter\b|\bx\s*\(twitter\)|\btweet\b|\bretweet\b/i],
];

/** Services we never want to sell / can't classify safely. */
const BLOCKED = /\btraffic\b|\bseo\b|\bbacklink|\bvote|\breview|\bpanel\b|\bmining\b|\bcrypto|\bapp\s*install|\bdownload|\bsignup|\bsurvey|\bsoftware|\bscript\b|\bgoogle\b|\bspotify\b|\bsoundcloud\b|\btwitch\b|\bdiscord\b|\bsnapchat\b|\blinkedin\b|\bthreads\b|\bwhatsapp\b|\bshopee|\btrustpilot|\bpinterest\b|\breddit\b|\bkick\b|\bnft\b|\bemail\b|\bsms\b|\bmixcloud|\bdeezer|\baudiomack|\btumblr|\bquora|\bvk\b|\bimo\b|\blikee\b|\bkwai\b|\bbigo\b|\bclubhouse|\brumble\b|\bdailymotion|\bbinance|\bwattpad|\btidal\b|\bnapster|\banghami|\bshazam|\bapple\s*music/i;

const STRICT_CATEGORY: [CategoryKey, RegExp][] = [
  ["comments", /\bcomments?\b|\breplies\b/i],
  ["reposts", /\breposts?\b|\bretweets?\b|\bshares?\s*\/\s*reposts?\b/i],
  ["shares", /\bshares?\b/i],
  ["followers", /\bfollowers?\b|\bsubscribers?\b|\bmembers?\b/i],
  ["likes", /\blikes?\b|\breactions?\b|\bfavorites?\b/i],
  ["views", /\bviews?\b|\bplays?\b|\bstory\s*views?\b|\bwatch\s*time\b|\blive\s*stream/i],
];

export interface Classified {
  platform: StrictPlatform;
  cat: CategoryKey;
}

/**
 * Decide which platform + category a provider service really belongs to.
 * Returns null when the service is ambiguous, off-topic or unsupported —
 * those never reach the storefront.
 */
export function classify(rawName: string, rawCategory = ""): Classified | null {
  const text = `${rawName} ${rawCategory}`;
  if (BLOCKED.test(text)) return null;

  // The service NAME decides the platform; the category is only a fallback.
  let platform: StrictPlatform | null = null;
  for (const [key, re] of STRICT_PLATFORM) if (re.test(rawName)) { platform = key; break; }
  if (!platform) for (const [key, re] of STRICT_PLATFORM) if (re.test(rawCategory)) { platform = key; break; }
  if (!platform) return null;

  // A name naming two platforms is ambiguous — skip it.
  const hits = STRICT_PLATFORM.filter(([, re]) => re.test(rawName)).length;
  if (hits > 1) return null;

  let cat: CategoryKey | null = null;
  for (const [key, re] of STRICT_CATEGORY) if (re.test(rawName)) { cat = key; break; }
  if (!cat) return null;

  return { platform, cat };
}

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  followers: "متابعين",
  likes: "لايكات",
  comments: "كومنتات",
  views: "مشاهدات",
  shares: "شير",
  reposts: "ريبوست",
  other: "خدمات تانية",
};

export const CATEGORY_ORDER: CategoryKey[] = [
  "followers",
  "likes",
  "views",
  "comments",
  "shares",
  "reposts",
];

/** Clean Arabic title built only from what we verified about the service. */
export function titleFor(c: Classified, rawName: string): string {
  const platLabel: Record<StrictPlatform, string> = {
    instagram: "انستجرام",
    tiktok: "تيك توك",
    facebook: "فيسبوك",
    youtube: "يوتيوب",
    telegram: "تليجرام",
    twitter: "تويتر",
  };
  const noun = c.cat === "followers" && c.platform === "youtube" ? "مشتركين" : CATEGORY_LABEL[c.cat];
  const a = attrsOf(rawName);
  const tags: string[] = [];
  if (a.arab) tags.push("عرب");
  if (a.real) tags.push("حسابات حقيقية");
  if (a.stable) tags.push("ثابت");
  const refillDays = /refill[^0-9a-z]{0,12}(\d{1,4})\s*days?/i.exec(rawName);
  if (refillDays) tags.push(`ضمان ${refillDays[1]} يوم`);
  else if (a.refill) tags.push("مع ضمان");
  const speed = /speed[^0-9]{0,14}(\d+(?:\.\d+)?\s*[kmKM]?)/i.exec(rawName);
  if (speed) tags.push(`سرعة ${speed[1].replace(/\s+/g, "").toUpperCase()}/يوم`);
  const head = `${noun} ${platLabel[c.platform]}`;
  return tags.length ? `${head} · ${tags.slice(0, 3).join(" · ")}` : head;
}
