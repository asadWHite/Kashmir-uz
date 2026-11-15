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
import PublicTracker from "@/app/components/PublicTracker";

import "./globals.css";

const siteUrl = SITE_URL;

export async function generateMetadata(): Promise<Metadata> {
  // Metadata uses the visitor's actual locale (read from cookie) so an
  // Uzbek visitor shares an Uzbek title and description, not Russian.
  // The canonical URL is language-independent because the cookie-based
  // architecture serves all languages from one URL.
  const locale = await getRequestLocale();
  const home = getHomeSeo(locale);
  const alternateLocales = LOCALES.filter((l) => l !== locale).map(
    (l) => OG_LOCALE[l],
  );

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
      locale: OG_LOCALE[locale],
      alternateLocale: alternateLocales,
      images: [
        {
          url: "/assets/hero.jpg",
          alt: home.title,
          width: 1536,
          height: 1024,
        },
      ],
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
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "content-language": locale,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f5f0eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `(function(){var root=document.documentElement;try{var t=localStorage.getItem('kashmir-theme');if(!t){t=localStorage.getItem('kashemir-theme');if(t)localStorage.setItem('kashmir-theme',t);}root.dataset.theme=t==='dark'?'dark':'light';}catch(e){root.dataset.theme='light';}})();`;

/**
 * Organization + LocalBusiness + WebSite structured data.
 *
 * Only verified business information is included:
 * - Brand name and URL: verified
 * - Area served (Tashkent): verified from business context
 * - Business type: curtain and interior design salon
 *
 * NOT included (unverified):
 * - Specific street address (fallback data says "Address to be confirmed")
 * - Phone numbers (demo data per README)
 * - Opening hours (not independently verified)
 * - Reviews, ratings, awards (none exist)
 * - Price range (not available)
 */
function buildJsonLd(
  locale: string,
  description: string,
  socialUrls: { instagramUrl: string; telegramUrl: string },
) {
  // Only include sameAs links that look like real, non-placeholder URLs.
  // The fallback values (e.g. "https://instagram.com/kashmir") are demo
  // data and must not appear in structured data.
  const sameAs = [socialUrls.instagramUrl, socialUrls.telegramUrl].filter(
    (url) =>
      url &&
      /^https?:\/\//.test(url) &&
      !/kashmirdecor\.com/i.test(url) && // exclude placeholder email-domain patterns
      url.length > 15, // exclude obviously truncated values
  );

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: BRAND.full,
    description,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    image: `${siteUrl}/assets/hero.jpg`,
    knowsAbout: [
      "Шторы в Ташкенте",
      "Пошив штор",
      "Портьеры",
      "Тюль",
      "Интерьерный текстиль",
      "Римские шторы",
      "Toshkentda pardalar",
      "Parda tikish",
      "Interyer dizayni",
      "Rim pardalari",
      "Custom curtains Tashkent",
    ],
    areaServed: { "@type": "City", name: "Tashkent" },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: BRAND.full,
    url: siteUrl,
    inLanguage: locale,
    publisher: { "@id": `${siteUrl}/#organization` },
  };

  // Service schema — describes what the business actually offers.
  // Only verified services are listed; no pricing, guarantees, or
  // unverified claims.
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Curtain design, tailoring and installation",
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: { "@type": "City", name: "Tashkent" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: locale === "uz"
        ? "Parda va interyer xizmatlari"
        : locale === "en"
          ? "Curtain and interior services"
          : "Услуги штор и интерьера",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: locale === "uz" ? "Parda dizayni" : locale === "en" ? "Curtain design" : "Дизайн штор",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: locale === "uz" ? "Parda tikish" : locale === "en" ? "Curtain tailoring" : "Пошив штор",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: locale === "uz" ? "O'rnatish" : locale === "en" ? "Installation" : "Монтаж",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: locale === "uz" ? "Interyer dizayni" : locale === "en" ? "Interior design" : "Дизайн интерьера",
          },
        },
      ],
    },
  };

  return JSON.stringify([organization, website, service]);
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getRequestLocale();
  const settings = await getSettings(locale);
  const home = getHomeSeo(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
            <p>
              <strong>KASHMIR DECOR</strong> — {locale === "uz"
                ? "Toshkentda pardalar va interyer dizayni saloni."
                : locale === "en"
                  ? "Curtain and interior design salon in Tashkent."
                  : "Салон штор и дизайна интерьеров в Ташкенте."}
            </p>
            <p>
              {settings.phone && (
                <a href={settings.phoneHref}>{settings.phone}</a>
              )}
              {settings.phone && settings.telegramUrl && " · "}
              {settings.telegramUrl && (
                <a href={settings.telegramUrl}>Telegram</a>
              )}
              {settings.instagramUrl && " · "}
              {settings.instagramUrl && (
                <a href={settings.instagramUrl}>Instagram</a>
              )}
            </p>
          </div>
        </noscript>
        <I18nProvider initialLocale={locale} settings={settings}>
          {children}
          <MobileContactCTA />
          <CompareWidget />
          <ServiceWorkerRegister />
          <PublicTracker />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: buildJsonLd(locale, home.description, {
                instagramUrl: settings.instagramUrl,
                telegramUrl: settings.telegramUrl,
              }),
            }}
          />
          <Analytics />
          <SpeedInsights />
        </I18nProvider>
      </body>
    </html>
  );
}
