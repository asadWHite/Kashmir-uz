import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCurtains, getActiveCategories } from "@/lib/data";
import { ASSETS } from "@/lib/constants";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import CollectionsClient from "./CollectionsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collection",
  description: "Explore the KASHMIR DECOR curtain collection — classic, modern, minimal and luxury drapery.",
  alternates: { canonical: "/collections" },
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
    category: c.category,
    imageUrl: c.imageUrl,
    material: c.material,
    color: c.color,
    isFeatured: c.isFeatured,
    likes: c.likes,
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
