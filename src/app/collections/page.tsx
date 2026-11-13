import type { Metadata } from "next";
import { COLLECTIONS_SEO, localizedAlternates, socialMeta } from "@/lib/seo";
import { getCachedCurtains, getCachedCategories } from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import CollectionsClient from "./CollectionsClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = COLLECTIONS_SEO[locale] ?? COLLECTIONS_SEO.ru;
  // One canonical URL for the shared, cookie-based route; no duplicate URLs.
  const isDefault = locale === "ru";
  return {
    title: isDefault ? copy.title : copy.title,
    description: copy.description,
    alternates: localizedAlternates("/collections"),
    ...socialMeta(copy.title, copy.description, "/collections"),
  };
}

export default async function CollectionsPage() {
  const locale = await getRequestLocale();
  const [curtains, categories] = await Promise.all([
    getCachedCurtains(locale),
    getCachedCategories(locale),
  ]);

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <CollectionsClient curtains={curtains} categories={categories} />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
