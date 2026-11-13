import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/constants";
import { LOCALES } from "@/lib/i18n";
import { I18nProvider } from "@/app/components/I18nProvider";
import {
  SITE_URL,
  getHomeSeo,
  localizedAlternates,
  OG_LOCALE,
} from "@/lib/seo";
import { getRequestLocale } from "@/lib/locale/server";
import { getSettings } from "@/lib/data";
import ServiceWorkerRegister from "@/app/components/ServiceWorkerRegister";
import MobileContactCTA from "@/app/components/MobileContactCTA";
import CompareWidget from "@/app/components/CompareWidget";

import "./globals.css";

const siteUrl = SITE_URL;

export async function generateMetadata(): Promise<Metadata> {
  // Indexed copy is always Russian: one canonical URL serves one language of
  // metadata, which is what the shared, cookie-based URL architecture
  // requires. See docs/audit/REPORT-2026-11-13.md §3 (SEO).
  const home = getHomeSeo("ru");
  const alternateLocales = LOCALES.filter((l) => l !== "ru").map((l) => OG_LOCALE[l]);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: home.title,
      template: `%s · ${BRAND.full}`,
    },
    description: home.description,
    alternates: localizedAlternates("/"),
    authors: [{ name: BRAND.full }],
    creator: BRAND.full,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: BRAND.full,
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon: "/icon.svg",
      apple: "/icon-512.png",
    },
    openGraph: {
      type: "website",
      url: siteUrl,
      title: home.title,
      description: home.description,
      siteName: BRAND.full,
      locale: OG_LOCALE.ru,
      alternateLocale: alternateLocales,
      images: [{ url: "/assets/hero.jpg", alt: "Шторы в Ташкенте — Kashmir Decor" }],
    },
    twitter: {
      card: "summary_large_image",
      title: home.title,
      description: home.description,
      images: ["/assets/hero.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export const viewport: Viewport = {
  // The site opens in light mode regardless of the visitor's OS appearance.
  themeColor: "#f5f0eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `(function(){var root=document.documentElement;try{var t=localStorage.getItem('kashmir-theme');if(!t){t=localStorage.getItem('kashemir-theme');if(t)localStorage.setItem('kashmir-theme',t);}root.dataset.theme=t==='dark'?'dark':'light';}catch(e){root.dataset.theme='light';}})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  // One locale read per request, shared by the HTML `lang` attribute, the
  // context and every database read on the page. `dynamic` is not forced here:
  // the cookie read already makes the route dynamic, which is required for
  // correct per-visitor language.
  const locale = await getRequestLocale();
  const settings = await getSettings(locale);
  const home = getHomeSeo("ru");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.full,
    description: home.description,
    url: siteUrl,
    image: `${siteUrl}/assets/hero.jpg`,
    knowsAbout: ["Шторы в Ташкенте", "Пошив штор", "Портьеры", "Тюль", "Интерьерный текстиль"],
    areaServed: { "@type": "City", name: "Tashkent" },
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <I18nProvider initialLocale={locale} settings={settings}>
          {children}
          <MobileContactCTA />
          <CompareWidget />
          <ServiceWorkerRegister />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <Analytics />
          <SpeedInsights />
        </I18nProvider>
      </body>
    </html>
  );
}
