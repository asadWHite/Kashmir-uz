import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInteriorBySlug } from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import { ASSETS } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import InteriorDetailClient from "./InteriorDetailClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

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
  const img = interior.imageUrl || ASSETS.interiors[0];
  const socialImage = img.startsWith("data:") ? ASSETS.interiors[0] : img;
  const canonical = absoluteUrl(`/interiors/${encodeURIComponent(interior.slug)}`);
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${title} · KASHMIR`,
      description: desc,
      url: canonical,
      locale: LOCALE_OG[locale],
      images: [{ url: socialImage, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description: desc, images: [socialImage] },
  };
}

const LOCALE_OG: Record<Locale, string> = { ru: "ru_RU", uz: "uz_UZ", en: "en_US" };

export default async function InteriorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const interior = await getInteriorBySlug(locale, slug);
  if (!interior) notFound();
  const img = interior.imageUrl || ASSETS.interiors[0];

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <InteriorDetailClient
          title={interior.title}
          description={interior.description}
          location={interior.location}
          imageUrl={img}
          gallery={interior.gallery}
        />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
