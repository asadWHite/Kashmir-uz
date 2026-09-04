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
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("kashmir-locale")?.value);
  const home = getHomeSeo(locale);
  const alternateLocales = LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]);

  return {
    metadataBase: new URL(siteUrl),
    title: home.title,
    description: home.description,
    keywords: [
      "шторы в Ташкенте",
      "шторы на заказ Ташкент",
      "пошив штор",
      "портьеры тюль",
      "интерьерный текстиль",
      "pardalar Toshkentda",
      "parda tikish Toshkent",
      "custom curtains Tashkent",
      "curtain studio Tashkent",
    ],
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
      images: [{ url: "/assets/hero.jpg", width: 1600, height: 900, alt: home.title }],
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: BRAND.full,
    description: home.description,
    url: siteUrl,
    image: `${siteUrl}/assets/hero.jpg`,
    knowsAbout: ["Curtains", "Drapery", "Tulle", "Interior textiles", "Custom window treatments"],
    address: { "@type": "PostalAddress", addressLocality: "Tashkent", addressCountry: "UZ" },
    areaServed: { "@type": "City", name: "Tashkent" },
    priceRange: "$$$",
  };

  return (
    <html
      lang={initialLocale}
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
