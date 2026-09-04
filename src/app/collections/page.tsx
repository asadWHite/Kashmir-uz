import type { Metadata } from "next";
import { SEO, localizedAlternates, socialMeta } from "@/lib/seo";
import Link from "next/link";
import { getActiveCurtains, getActiveCategories } from "@/lib/data";
import { ASSETS } from "@/lib/constants";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import CollectionsClient from "./CollectionsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: SEO.collections.title,
  description: SEO.collections.description,
  keywords: ["шторы на заказ Ташкент", "pardalar buyurtma qilish", "custom curtains Tashkent"],
  alternates: localizedAlternates("/collections"),
  ...socialMeta(SEO.collections.title, SEO.collections.description, "/collections"),
};

export default async function CollectionsPage() {
  const curtainList = await getActiveCurtains();
  const categoryList = await getActiveCategories();
  const { getSettings } = await import("@/lib/data");
  const settings = await getSettings();

  const curtains = curtainList.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    category: c.category,
    imageUrl: c.imageUrl,
    material: c.material,
    color: c.color,
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
