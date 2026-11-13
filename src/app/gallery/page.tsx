import type { Metadata } from "next";
import { GALLERY_SEO, localizedAlternates, socialMeta } from "@/lib/seo";
import { getCachedCurtains, getCachedGallery, getCachedInteriors } from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import { ASSETS } from "@/lib/constants";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import GalleryClient, { type GalleryItem } from "./GalleryClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = GALLERY_SEO[locale] ?? GALLERY_SEO.ru;
  return {
    title: copy.title,
    description: copy.description,
    alternates: localizedAlternates("/gallery"),
    ...socialMeta(copy.title, copy.description, "/gallery"),
  };
}

export default async function GalleryPage() {
  const locale = await getRequestLocale();
  const [gallery, interiors, curtains] = await Promise.all([
    getCachedGallery(locale),
    getCachedInteriors(locale),
    getCachedCurtains(locale),
  ]);

  const items: GalleryItem[] = [
    ...gallery.map((g) => ({
      id: g.id,
      imageUrl: g.imageUrl,
      category: g.category,
      title: g.title,
    })),
    ...interiors.map((i, idx) => ({
      id: 10000 + i.id,
      imageUrl: i.imageUrl || ASSETS.interiors[idx % ASSETS.interiors.length],
      category: "interior",
      title: i.title,
    })),
    ...curtains.map((c, idx) => ({
      id: 20000 + c.id,
      imageUrl: c.imageUrl || ASSETS.curtains[idx % ASSETS.curtains.length],
      category: "curtain",
      title: c.name,
    })),
  ];

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <GalleryClient items={items} />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
