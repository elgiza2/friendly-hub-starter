// Platform icons — imported from react-icons/si (Simple Icons) with authentic brand colors.

import { SiInstagram, SiTiktok, SiFacebook, SiYoutube, SiTelegram, SiX } from "react-icons/si";
import type { ComponentType, SVGProps, ReactElement } from "react";

export type PlatformKey =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "youtube"
  | "telegram"
  | "twitter";

/** Wrap a brand icon inside a filled rounded tile so it reads on any background. */
function tile(Icon: ComponentType<{ size?: number; color?: string }>, bg: string, iconColor = "#fff") {
  return function TiledIcon(props: SVGProps<SVGSVGElement>): ReactElement {
    const size = Number(props.width ?? 48);
    const pad = Math.round(size * 0.22);
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.26),
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={size - pad * 2} color={iconColor} />
      </div>
    );
  };
}

// Instagram gradient
const IG_BG = "linear-gradient(135deg,#feda75 0%,#fa7e1e 25%,#d62976 55%,#962fbf 80%,#4f5bd5 100%)";

export const PLATFORMS: {
  key: PlatformKey;
  label: string;
  match: RegExp;
  Icon: (p: SVGProps<SVGSVGElement>) => ReactElement;
}[] = [
  { key: "instagram", label: "انستجرام", match: /instagram|insta|ig\b|انست|إنست|انستا|إنستا|انستجرام|انستغرام/i, Icon: tile(SiInstagram, IG_BG) },
  { key: "tiktok",    label: "تيك توك",   match: /tiktok|tik.?tok|تيك\s*توك|تيكتوك/i, Icon: tile(SiTiktok, "#000") },
  { key: "facebook",  label: "فيسبوك",    match: /facebook|fb\b|فيس\s*بوك|فيسبوك|فيس/i, Icon: tile(SiFacebook, "#1877F2") },
  { key: "youtube",   label: "يوتيوب",    match: /youtube|yt\b|يوتيوب|يوتوب/i, Icon: tile(SiYoutube, "#FF0033") },
  { key: "telegram",  label: "تليجرام",   match: /telegram|tg\b|تليجرام|تلجرام|تليغرام|تلغرام/i, Icon: tile(SiTelegram, "linear-gradient(180deg,#37AEE2,#1E88C6)") },
  { key: "twitter",   label: "تويتر / X", match: /twitter|\bx\s|\/x\b|^x$|تويتر|اكس|إكس/i, Icon: tile(SiX, "#000") },
];

export function detectPlatform(text: string): PlatformKey | null {
  for (const p of PLATFORMS) if (p.match.test(text)) return p.key;
  return null;
}
