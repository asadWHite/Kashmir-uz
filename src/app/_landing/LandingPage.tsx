import type { Metadata } from "next";
import { cookies } from "next/headers";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import SeoLanding from "@/app/components/SeoLanding";
import { getLanding } from "@/lib/landing-content";
import { localizedAlternates, SITE_URL, OG_LOCALE } from "@/lib/seo";
import { resolveLocale } from "@/lib/seo";
import { getSettings } from "@/lib/data";
import type { Locale } from "@/lib/i18n";

type Params = { slug: string };

/**
 * Generic SEO landing page — shared by all /:slug landing pages
 * (/toshkentda-pardalar, /rim-pardalar, /klassik-pardalar, ...).
 * Generates per-locale metadata + JSON-LD Article/Breadcrumb schema.
 */
export default async function LandingPage({
  slug,
  extraJsonLd,
}: {
  slug: string;
  extraJsonLd?: Record<string, unknown>;
}) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("kashmir-locale")?.value) as Locale;
  const settings = await getSettings();
  const copy = getLanding(slug, locale);

  // BreadcrumbList for better crawler understanding.
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: copy.h1, item: `${SITE_URL}/${slug}` },
    ],
  };

  return (
    <>
      <Navbar />
      <main>
        <SeoLanding
          eyebrow={copy.eyebrow}
          h1={copy.h1}
          intro={copy.intro}
          imageSrc={copy.image}
          imageAlt={copy.imageAlt}
          sections={copy.sections}
          highlights={copy.highlights}
          ctaLabel={copy.ctaLabel}
          ctaHref={copy.ctaHref}
          related={copy.related}
        />
      </main>
      <Footer settings={settings} />
      <BackToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {extraJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(extraJsonLd) }}
        />
      )}
    </>
  );
}

export function buildMetadata(slug: string): Metadata {
  const copyUz = getLanding(slug, "uz");
  const copyRu = getLanding(slug, "ru");
  const copyEn = getLanding(slug, "en");
  const ogTitle = copyUz.h1;
  return {
    title: ogTitle,
    description: copyUz.intro.slice(0, 170),
    alternates: localizedAlternates(`/${slug}`),
    openGraph: {
      type: "article",
      url: `${SITE_URL}/${slug}`,
      title: ogTitle,
      description: copyUz.intro.slice(0, 170),
      siteName: "Kashmir Decor",
      locale: OG_LOCALE.uz,
      alternateLocale: [OG_LOCALE.ru, OG_LOCALE.en],
      images: [
        {
          url: copyUz.image,
          width: 1200,
          height: 1500,
          alt: copyUz.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: copyUz.intro.slice(0, 170),
      images: [copyUz.image],
    },
    robots: { index: true, follow: true },
    other: {
      // Surface RU/EN versions for crawlers that read these tags directly.
      "og:title:ru": copyRu.h1,
      "og:description:ru": copyRu.intro.slice(0, 170),
      "og:title:en": copyEn.h1,
      "og:description:en": copyEn.intro.slice(0, 170),
    },
  };
}
