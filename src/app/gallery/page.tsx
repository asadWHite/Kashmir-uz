import type { Metadata } from "next";
import { SEO, localizedAlternates, socialMeta } from "@/lib/seo";
import { getActiveGallery, getActiveInteriors, getActiveCurtains, getSettings } from "@/lib/data";
import { ASSETS } from "@/lib/constants";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: SEO.gallery.title,
  description: SEO.gallery.description,
  keywords: ["портьеры Ташкент", "pardalar Toshkentda", "drapes Tashkent"],
  alternates: localizedAlternates("/gallery"),
  ...socialMeta(SEO.gallery.title, SEO.gallery.description, "/gallery"),
};

export type GalleryItem = { id: number; imageUrl: string; category: string; title: string | null };

export default async function GalleryPage() {
  const [gallery, interiors, curtains, settings] = await Promise.all([
    getActiveGallery(),
    getActiveInteriors(),
    getActiveCurtains(),
    getSettings(),
  ]);

  const items: GalleryItem[] = [
    ...gallery.map((g) => ({ id: g.id, imageUrl: g.imageUrl, category: g.category, title: g.title })),
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
      <Footer settings={settings} />
      <BackToTop />
    </>
  );
}
