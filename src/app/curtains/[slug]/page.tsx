import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurtainBySlug, getRelatedCurtains } from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import { ASSETS } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import CurtainDetailClient from "./CurtainDetailClient";
import RelatedGrid, { type RelatedItem } from "./RelatedGrid";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const LOCALE_OG: Record<Locale, string> = { ru: "ru_RU", uz: "uz_UZ", en: "en_US" };

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
  const img = curtain.imageUrl || ASSETS.curtains[0];
  const socialImage = img.startsWith("data:") ? ASSETS.curtains[0] : img;
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
      images: [{ url: socialImage, alt: curtain.name }],
    },
    twitter: { card: "summary_large_image", title, description: desc, images: [socialImage] },
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

  // The related grid is derived from the same localized list (no extra query)
  // and rendered for the same language.
  const related = await getRelatedCurtains(locale, curtain.category, curtain.id);
  const img = curtain.imageUrl || ASSETS.curtains[0];

  const relatedItems: RelatedItem[] = related.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    category: c.category,
  }));

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <CurtainDetailClient curtain={curtain} img={img} />
        <RelatedGrid items={relatedItems} />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
