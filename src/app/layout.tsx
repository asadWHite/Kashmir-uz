import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/constants";
import { LOCALES } from "@/lib/i18n";
import { I18nProvider } from "@/app/components/I18nProvider";
import {
  SITE_URL,
  getHomeSeo,
  localizedAlternates,
  OG_LOCALE,
  resolveLocale,
} from "@/lib/seo";
import ServiceWorkerRegister from "@/app/components/ServiceWorkerRegister";
import MobileContactCTA from "@/app/components/MobileContactCTA";
import CompareWidget from "@/app/components/CompareWidget";

import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = SITE_URL;

export async function generateMetadata(): Promise<Metadata> {
  // Default indexed copy is Uzbek — primary SEO target is "Toshkentda pardalar".
  const home = getHomeSeo("uz");
  const alternateLocales = LOCALES.filter((l) => l !== "uz").map((l) => OG_LOCALE[l]);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: home.title,
      template: `%s | ${BRAND.full}`,
    },
    description: home.description,
    keywords: [
      "parda",
      "pardalar",
      "Toshkentda pardalar",
      "Toshkent parda salonlari",
      "parda saloni Toshkent",
      "zamonaviy pardalar Toshkent",
      "premium pardalar Toshkent",
      "klassik pardalar Toshkent",
      "Rim pardalari Toshkent",
      "uy uchun pardalar Toshkent",
      "шторы в Ташкенте",
      "curtains in Tashkent",
    ],
    alternates: localizedAlternates("/"),
    authors: [{ name: BRAND.full }],
    creator: BRAND.full,
    publisher: BRAND.full,
    category: "Interior Design",
    applicationName: BRAND.full,
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
      locale: OG_LOCALE.uz,
      alternateLocale: alternateLocales,
      images: [
        {
          url: "/assets/hero.jpg",
          width: 1600,
          height: 900,
          alt: "Toshkentda pardalar — Kashmir Decor premium parda saloni",
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
    formatDetection: { email: false, address: false, telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1e2023" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `(function(){try{var t=localStorage.getItem('kashmir-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const initialLocale = resolveLocale(cookieStore.get("kashmir-locale")?.value);
  const home = getHomeSeo(initialLocale);

  // LocalBusiness JSON-LD — only real, verifiable fields are populated.
  // We deliberately avoid fake reviews, ratings, or opening hours that we
  // cannot confirm. The telephone/address/email are resolved by the site
  // settings at page render time — but in this root layout we use the
  // homepage fallback data to keep it statically cacheable. Components that
  // render individual pages can extend this schema.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#kashmirdecor`,
    name: BRAND.full,
    alternateName: "Kashmir Decor",
    description: home.description,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    image: `${siteUrl}/assets/hero.jpg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tashkent",
      addressCountry: "UZ",
      addressRegion: "Toshkent",
    },
    areaServed: [
      { "@type": "City", name: "Tashkent" },
      { "@type": "Country", name: "Uzbekistan" },
    ],
    priceRange: "$$$",
    knowsAbout: [
      "Pardalar",
      "Toshkentda pardalar",
      "Rim pardalari",
      "Zamonaviy pardalar",
      "Klassik pardalar",
      "Premium pardalar",
      "Interyer dizayni",
      "Curtains in Tashkent",
      "Шторы в Ташкенте",
    ],
    availableLanguage: ["uz", "ru", "en"],
    sameAs: [],
  };

  return (
    <html
      lang={initialLocale}
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href={siteUrl} />
      </head>
      <body>
        <I18nProvider initialLocale={initialLocale}>
          {children}
          <MobileContactCTA />
          <CompareWidget />
          <ServiceWorkerRegister />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <Analytics />
        </I18nProvider>
      </body>
    </html>
  );
}
