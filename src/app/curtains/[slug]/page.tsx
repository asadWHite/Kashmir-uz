import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurtainBySlug, getRelatedCurtains } from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import CurtainDetailClient from "./CurtainDetailClient";
import RelatedGrid, { type RelatedItem } from "./RelatedGrid";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const LOCALE_OG: Record<Locale, string> = { ru: "ru_RU", uz: "uz_UZ", en: "en_US" };

const BREADCRUMB_LABELS: Record<Locale, { home: string; collection: string }> = {
  ru: { home: "Главная", collection: "Коллекция" },
  uz: { home: "Bosh sahifa", collection: "Kolleksiya" },
  en: { home: "Home", collection: "Collection" },
};

function socialImageUrl(source: string | null): string | null {
  if (!source || /^data:/i.test(source)) return null;
  return /^https?:\/\//i.test(source) ? source : absoluteUrl(source);
}

/**
 * BreadcrumbList structured data for product detail pages.
 * Helps Google display a breadcrumb trail in search results.
 */
function breadcrumbJsonLd(locale: Locale, productName: string, productUrl: string) {
  const labels = BREADCRUMB_LABELS[locale] ?? BREADCRUMB_LABELS.ru;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: labels.home,
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: labels.collection,
        item: `${SITE_URL}/collections`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productName,
        item: productUrl,
      },
    ],
  };
}

/**
 * Product metadata is taken from the localized record (seo_title /
 * seo_description, or the localized name/description), so an Uzbek visitor
 * shares an Uzbek title and Google sees copy that matches the page. The
 * canonical is language-independent, which is what the shared URL requires.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const curtain = await getCurtainBySlug(locale, slug);
  if (!curtain) return { title: "Not found", robots: { index: false, follow: false } };

  const title = curtain.seoTitle;
  const desc = curtain.seoDescription;
  const socialImage = socialImageUrl(curtain.gallery?.[0] ?? null);
  const canonical = absoluteUrl(`/curtains/${encodeURIComponent(curtain.slug)}`);
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      locale: LOCALE_OG[locale],
      ...(socialImage ? { images: [{ url: socialImage, alt: curtain.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      ...(socialImage ? { images: [socialImage] } : {}),
    },
    other: { "content-language": locale },
  };
}

export default async function CurtainDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const curtain = await getCurtainBySlug(locale, slug);
  if (!curtain) notFound();

  const related = await getRelatedCurtains(locale, curtain.category, curtain.id);

  const relatedItems: RelatedItem[] = related.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    category: c.category,
  }));

  const canonical = absoluteUrl(`/curtains/${encodeURIComponent(curtain.slug)}`);
  const breadcrumbSchema = breadcrumbJsonLd(locale, curtain.name, canonical);

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <CurtainDetailClient curtain={curtain} />
        <RelatedGrid items={relatedItems} />
      </main>
      <Footer />
      <BackToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
