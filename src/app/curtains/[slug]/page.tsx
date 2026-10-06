import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurtainBySlug, getRelatedCurtains, getSettings } from "@/lib/data";
import { BRAND, ASSETS } from "@/lib/constants";
import CurtainDetailClient from "./CurtainDetailClient";
import RelatedGrid, { type RelatedItem } from "./RelatedGrid";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const curtain = await getCurtainBySlug(slug);
  if (!curtain) return { title: "Not found" };
  // Just the name — the root title template appends "· KASHMIR DECOR".
  const title = curtain.name;
  const desc = curtain.description || `${curtain.name} — premium curtain by ${BRAND.full}.`;
  const img = curtain.imageUrl || ASSETS.curtains[0];
  const socialImage = img.startsWith("data:") ? ASSETS.curtains[0] : img;
  const canonical = `${SITE_URL}/curtains/${encodeURIComponent(curtain.slug)}`;
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      images: [{ url: socialImage, width: 1200, height: 1500, alt: curtain.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [socialImage],
    },
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

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <CurtainDetailClient curtain={detail} settings={settings} img={img} />
        <RelatedGrid items={relatedItems} />
      </main>
      <Footer settings={settings} />
      <BackToTop />
    </>
  );
}
