import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInteriorBySlug } from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import InteriorDetailClient from "./InteriorDetailClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const LOCALE_OG: Record<Locale, string> = { ru: "ru_RU", uz: "uz_UZ", en: "en_US" };

const BREADCRUMB_LABELS: Record<Locale, { home: string; interiors: string }> = {
  ru: { home: "Главная", interiors: "Интерьеры" },
  uz: { home: "Bosh sahifa", interiors: "Interyerlar" },
  en: { home: "Home", interiors: "Interiors" },
};

/**
 * BreadcrumbList structured data for interior project detail pages.
 */
function breadcrumbJsonLd(locale: Locale, title: string, url: string) {
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
        name: labels.interiors,
        item: `${SITE_URL}/interiors`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: url,
      },
    ],
  };
}

/**
 * Metadata is generated for the SAME locale the page renders in, so the title,
 * description and Open Graph copy always match the visible content.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const interior = await getInteriorBySlug(locale, slug);
  if (!interior) return { title: "Not found", robots: { index: false, follow: false } };

  const title = interior.seoTitle;
  const desc = interior.seoDescription;
  const canonical = absoluteUrl(`/interiors/${encodeURIComponent(interior.slug)}`);
  const socialImage = interior.imageUrl ? absoluteUrl(interior.imageUrl) : null;
  const imageMetadata = socialImage
    ? { images: [{ url: socialImage, alt: title }] }
    : {};
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${title} · KASHMIR`,
      description: desc,
      url: canonical,
      locale: LOCALE_OG[locale],
      ...imageMetadata,
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

export default async function InteriorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const interior = await getInteriorBySlug(locale, slug);
  if (!interior) notFound();

  const canonical = absoluteUrl(`/interiors/${encodeURIComponent(interior.slug)}`);
  const breadcrumbSchema = breadcrumbJsonLd(locale, interior.title, canonical);

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <InteriorDetailClient
          id={interior.id}
          title={interior.title}
          description={interior.description}
          location={interior.location}
          imageUrl={interior.imageUrl}
          gallery={interior.gallery}
        />
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
