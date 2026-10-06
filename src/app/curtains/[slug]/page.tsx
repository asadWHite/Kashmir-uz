import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurtainBySlug, getRelatedCurtains, getSettings } from "@/lib/data";
import { BRAND, ASSETS } from "@/lib/constants";
import { SITE_URL, localizedAlternates, OG_LOCALE } from "@/lib/seo";
import CurtainDetailClient from "./CurtainDetailClient";
import RelatedGrid, { type RelatedItem } from "./RelatedGrid";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const curtain = await getCurtainBySlug(slug);
  if (!curtain) return { title: "Topilmadi", robots: { index: false } };
  const title = `${curtain.name} — ${BRAND.full}`;
  const desc =
    curtain.description ||
    `${curtain.name} — Kashmir Decor salonida Toshkentda sifatli parda. Professional tikish va o'rnatish.`;
  const img = curtain.imageUrl || ASSETS.curtains[0];
  const url = `/curtains/${curtain.slug}`;
  return {
    title,
    description: desc,
    keywords: [
      curtain.name,
      "parda",
      "pardalar",
      "Toshkentda pardalar",
      curtain.category || "parda modellari",
      `${curtain.material || ""} parda`,
    ].filter(Boolean),
    alternates: localizedAlternates(url),
    openGraph: {
      type: "article",
      title,
      description: desc,
      url: `${SITE_URL}${url}`,
      siteName: BRAND.full,
      locale: OG_LOCALE.uz,
      images: [{ url: img, width: 1200, height: 1500, alt: `${curtain.name} — Kashmir Decor Toshkent` }],
    },
    twitter: { card: "summary_large_image", title, description: desc, images: [img] },
    robots: { index: true, follow: true },
  };
}

export default async function CurtainDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const curtain = await getCurtainBySlug(slug);
  if (!curtain) notFound();
  const related = await getRelatedCurtains(curtain.category, curtain.id);
  const settings = await getSettings();
  const img = curtain.imageUrl || ASSETS.curtains[0];

  const detail = {
    id: curtain.id,
    name: curtain.name,
    slug: curtain.slug,
    description: curtain.description,
    category: curtain.category,
    imageUrl: curtain.imageUrl,
    gallery: curtain.gallery,
    material: curtain.material,
    color: curtain.color,
    style: curtain.style,
    room: curtain.room,
    isFeatured: curtain.isFeatured,
    likes: curtain.likes,
  };

  const relatedItems: RelatedItem[] = related.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    category: c.category,
  }));

  // Product schema — only factual, real fields (no fake rating/review).
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: curtain.name,
    description: curtain.description || "",
    image: img.startsWith("http") ? img : `${SITE_URL}${img}`,
    brand: { "@type": "Brand", name: BRAND.full },
    category: curtain.category || "Curtains",
    material: curtain.material || undefined,
    color: curtain.color || undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/curtains/${curtain.slug}`,
      priceCurrency: "UZS",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: BRAND.full },
    },
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <CurtainDetailClient curtain={detail} settings={settings} img={img} />
        <RelatedGrid items={relatedItems} />
      </main>
      <Footer settings={settings} />
      <BackToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </>
  );
}
