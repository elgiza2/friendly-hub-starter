// Per-service, per-platform instructions shown on the order page.
// Keeps copy focused: the user should know exactly what to paste.

import type { PlatformKey } from "./platform-icons";
import type { CategoryKey } from "./service-taxonomy";

export interface OrderInstructions {
  linkLabel: string;   // what to type above the input
  linkPlaceholder: string;
  steps: string[];     // ordered "how to get the link" steps
  warn?: string;       // gotchas (e.g., account must be public)
}

const PROFILE_PUBLIC_WARN = "لازم الحساب يبقى Public عشان الخدمة تشتغل.";
const POST_PUBLIC_WARN = "لازم البوست يبقى ظاهر للكل مش برايفت.";

/** Steps to open your own profile/post per platform. */
function getProfileLink(p: PlatformKey): string[] {
  switch (p) {
    case "instagram":
      return [
        "افتح انستجرام وروح لبروفايلك.",
        "اضغط على الثلاث نقط (⋯) فوق.",
        "اختار مشاركة البروفايل وبعدها انسخ اللينك.",
      ];
    case "tiktok":
      return [
        "افتح تيك توك وروح لصفحتك Profile.",
        "اضغط على السهم أو زر المشاركة فوق يمين.",
        "اختار نسخ اللينك.",
      ];
    case "facebook":
      return [
        "افتح صفحتك أو بروفايلك على فيسبوك.",
        "اضغط على الثلاث نقط جنب اسمك وبعدين انسخ اللينك.",
      ];
    case "youtube":
      return [
        "افتح قناتك على يوتيوب.",
        "انسخ لينك القناة من فوق، غالباً بيبدأ بـ youtube.com/@.",
      ];
    case "telegram":
      return [
        "افتح قناتك أو مجموعتك.",
        "اضغط على اسم القناة وانسخ لينك الدعوة أو اليوزر، مثال: t.me/username.",
      ];
    case "twitter":
      return [
        "افتح بروفايلك على X (تويتر).",
        "انسخ لينك الصفحة من فوق: twitter.com/username أو x.com/username.",
      ];
  }
}

function getPostLink(p: PlatformKey, what: "post" | "video" | "tweet" | "comment"): string[] {
  const noun =
    what === "video" ? "الفيديو" :
    what === "tweet" ? "التغريدة" :
    what === "comment" ? "الكومنت" : "البوست";
  switch (p) {
    case "instagram":
      return [
        `افتح ${noun} على انستجرام.`,
        "اضغط على (⋯) فوق البوست واختار نسخ اللينك.",
      ];
    case "tiktok":
      return [
        `افتح ${noun} في تيك توك.`,
        "اضغط زر المشاركة (السهم على اليمين) وبعدين انسخ اللينك.",
      ];
    case "facebook":
      return [
        `افتح ${noun} على فيسبوك.`,
        "اضغط على تاريخ البوست عشان يفتح لوحده، وبعدين انسخ اللينك من فوق.",
      ];
    case "youtube":
      return [
        `افتح ${noun} على يوتيوب.`,
        "انسخ اللينك كامل من فوق أو من زر مشاركة.",
      ];
    case "telegram":
      return [
        `افتح ${noun} في القناة.`,
        "دوس عليه ضغطة طويلة واختار Copy Link.",
      ];
    case "twitter":
      return [
        `افتح ${noun} على X.`,
        "اضغط زر المشاركة تحته وبعدين انسخ اللينك.",
      ];
  }
}

export function getInstructions(platform: PlatformKey | null, cat: CategoryKey): OrderInstructions {
  if (!platform) {
    return {
      linkLabel: "اللينك",
      linkPlaceholder: "https://...",
      steps: ["الصق اللينك المطلوب للخدمة هنا."],
    };
  }

  const platformNames: Record<PlatformKey, string> = {
    instagram: "الانستجرام", tiktok: "التيك توك", facebook: "الفيسبوك",
    youtube: "اليوتيوب", telegram: "التليجرام", twitter: "الـ X",
  };
  const pName = platformNames[platform];

  switch (cat) {
    case "followers":
      return {
        linkLabel: `لينك حسابك على ${pName}`,
        linkPlaceholder: platform === "telegram" ? "t.me/username" : "https://...",
        steps: getProfileLink(platform),
        warn: PROFILE_PUBLIC_WARN,
      };

    case "likes":
      return {
        linkLabel: `لينك البوست اللي عايز عليه لايكات`,
        linkPlaceholder: "https://...",
        steps: getPostLink(platform, platform === "youtube" || platform === "tiktok" ? "video" : platform === "twitter" ? "tweet" : "post"),
        warn: POST_PUBLIC_WARN,
      };

    case "comments":
      return {
        linkLabel: "لينك البوست اللي عايز عليه كومنتات",
        linkPlaceholder: "https://...",
        steps: [
          ...getPostLink(platform, "post"),
          "لو الخدمة محتاجة كومنتات معينة، هنوضحلك بعد الطلب.",
        ],
        warn: POST_PUBLIC_WARN,
      };

    case "views":
      return {
        linkLabel: `لينك الفيديو / الريلز`,
        linkPlaceholder: "https://...",
        steps: getPostLink(platform, "video"),
      };

    case "shares":
      return {
        linkLabel: "لينك البوست اللي عايز عليه شير",
        linkPlaceholder: "https://...",
        steps: getPostLink(platform, "post"),
        warn: POST_PUBLIC_WARN,
      };

    case "reposts":
      return {
        linkLabel: platform === "twitter" ? "لينك التغريدة" : "لينك البوست",
        linkPlaceholder: "https://...",
        steps: getPostLink(platform, platform === "twitter" ? "tweet" : "post"),
      };

    default:
      return {
        linkLabel: "اللينك المطلوب",
        linkPlaceholder: "https://...",
        steps: [
          "افتح الحاجة اللي عايز الخدمة تشتغل عليها.",
          "استخدم زر المشاركة وانسخ اللينك والصقه هنا.",
        ],
      };
  }
}
