import type { Metadata } from "next";
import { SEO, localizedAlternates, socialMeta } from "@/lib/seo";
import { getActiveCurtains, getActiveCategories, getSettings } from "@/lib/data";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import CollectionsClient from "./CollectionsClient";
import type { CurtainView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: SEO.collections.title,
  description: SEO.collections.description,
  alternates: localizedAlternates("/collections"),
  ...socialMeta(SEO.collections.title, SEO.collections.description, "/collections"),
};

export default async function CollectionsPage() {
  const [curtainList, categoryList, settings] = await Promise.all([
    getActiveCurtains(),
    getActiveCategories(),
    getSettings(),
  ]);

  const curtains: CurtainView[] = curtainList.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    category: c.category,
    imageUrl: c.imageUrl,
    material: c.material,
    color: c.color,
    style: c.style,
    room: c.room,
    isFeatured: c.isFeatured,
    likes: c.likes,
    sortOrder: c.sortOrder,
  }));
  const categories = categoryList.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <CollectionsClient curtains={curtains} categories={categories} />
      </main>
      <Footer settings={settings} />
      <BackToTop />
    </>
  );
}
