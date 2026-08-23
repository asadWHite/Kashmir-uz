import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/constants";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";
import { I18nProvider } from "@/app/components/I18nProvider";
import ServiceWorkerRegister from "@/app/components/ServiceWorkerRegister";
import MobileContactCTA from "@/app/components/MobileContactCTA";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://kashmirdecor.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.full} — Luxury Curtains & Interior Design`,
    template: `%s · ${BRAND.full}`,
  },
  description:
    "KASHMIR DECOR is a curtain studio and interior design atelier composing quiet, architectural, quietly luxurious interiors — tailored drapery, textiles and full-room design.",
  keywords: [
    "KASHMIR DECOR",
    "luxury curtains",
    "interior design",
    "curtain studio",
    "drapery",
    "premium interiors",
  ],
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${BRAND.full} — Luxury Curtains & Interior Design`,
    description:
      "A curtain studio and interior design atelier composing quiet, architectural, quietly luxurious interiors.",
    siteName: BRAND.full,
    images: [{ url: "/assets/hero.jpg", width: 1600, height: 900, alt: BRAND.full }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.full} — Luxury Curtains & Interior Design`,
    description:
      "A curtain studio and interior design atelier composing quiet, architectural interiors.",
    images: ["/assets/hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: BRAND.full,
  description:
    "Curtain studio and interior design atelier. Luxury curtains, drapery and architectural interiors.",
  url: siteUrl,
  image: `${siteUrl}/assets/hero.jpg`,
  knowsAbout: ["Curtains", "Drapery", "Interior Design", "Textiles"],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("kashmir-locale")?.value as Locale | undefined;
  const initialLocale =
    cookieLocale && LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

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
