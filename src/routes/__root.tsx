import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteBackground } from "../components/SiteBackground";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة دي مش موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط ده مش موجود أو اتغيّر. ارجع للرئيسية وابدأ من هناك.
        </p>
        <div className="mt-6">
          <Link to="/" className="ios-btn-primary press-scale inline-flex">
            ارجع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          حصل خطأ في الصفحة دي
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          جرب تحدّث الصفحة أو ارجع للرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="ios-btn-primary press-scale"
          >
            حاول تاني
          </button>
          <a href="/" className="ios-btn-secondary press-scale">ارجع للرئيسية</a>
        </div>
      </div>
    </div>
  );
}

const TITLE = "تريندنج — زيادة متابعين السوشيال ميديا";
const DESCRIPTION = "زوّد متابعينك، لايكاتك، ومشاهداتك على انستجرام، تيك توك، يوتيوب، فيسبوك، وتويتر بأسعار مصرية وشحن فودافون كاش.";

const FONT_FACES = `
@font-face {
  font-family: "ITC Garamond Std Narrow";
  font-weight: 300;
  font-style: normal;
  font-display: swap;
  src: url("https://res.cloudinary.com/dgupuutfn/raw/upload/v1783596334/ITCGaramondStd-LtNarrow_i2zcip.woff2") format("woff2"),
       url("https://res.cloudinary.com/dgupuutfn/raw/upload/v1783596334/ITCGaramondStd-LtNarrow_soc5vc.woff") format("woff");
}
@font-face {
  font-family: "ITC Garamond Std Narrow";
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("https://res.cloudinary.com/dgupuutfn/raw/upload/v1783596334/ITCGaramondStd-BkNarrow_xjfoc0.woff2") format("woff2"),
       url("https://res.cloudinary.com/dgupuutfn/raw/upload/v1783596334/ITCGaramondStd-BkNarrow_wfoxm1.woff") format("woff");
}
@font-face {
  font-family: "ITC Garamond Std Narrow";
  font-weight: 400;
  font-style: italic;
  font-display: swap;
  src: url("https://res.cloudinary.com/dgupuutfn/raw/upload/v1783596334/ITCGaramondStd-BkNarrowIta_hiy9ld.woff2") format("woff2"),
       url("https://res.cloudinary.com/dgupuutfn/raw/upload/v1783596334/ITCGaramondStd-BkNarrowIta_rlarxo.woff") format("woff");
}
`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#070402" },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_EG" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
    scripts: [],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar-EG" dir="rtl">
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: FONT_FACES }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const app = (
    <>
      <SiteBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        <Outlet />
      </div>
    </>
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthStateListener queryClient={queryClient} />
      {app}
    </QueryClientProvider>
  );
}

/**
 * Refetch router + queries when the auth identity changes (sign-in via Google,
 * sign-out, profile update). Deliberately skips TOKEN_REFRESHED/INITIAL_SESSION.
 */
function AuthStateListener({ queryClient }: { queryClient: QueryClient }) {
  const router = useRouter();
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let active = true;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      if (!active) return;
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      unsub = () => data.subscription.unsubscribe();
    });
    return () => {
      active = false;
      unsub?.();
    };
  }, [router, queryClient]);
  return null;
}
