import type { Metadata } from "next";
import { SEO, localizedAlternates, socialMeta, SITE_URL, getLocalePage, OG_LOCALE } from "@/lib/seo";
import Link from "next/link";
import { getActiveCurtains, getActiveCategories } from "@/lib/data";
import { ASSETS } from "@/lib/constants";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import CollectionsClient from "./CollectionsClient";

export const dynamic = "force-dynamic";

const pageSeo = getLocalePage(SEO.collections, "uz");

export const metadata: Metadata = {
  title: pageSeo.title,
  description: pageSeo.description,
  keywords: [
    "parda",
    "pardalar",
    "Toshkentda pardalar",
    "parda kolleksiyasi",
    "zamonaviy pardalar Toshkent",
    "klassik pardalar Toshkent",
    "parda salon Toshkent",
    "шторы Ташкент",
    "curtains Tashkent",
  ],
  alternates: localizedAlternates("/collections"),
  openGraph: {
    type: "website",
    url: `${SITE_URL}/collections`,
    title: pageSeo.title,
    description: pageSeo.description,
    siteName: "Kashmir Decor",
    locale: OG_LOCALE.uz,
    images: [{ url: "/assets/curtain-01.jpg", width: 1200, height: 1500, alt: "Pardalar kolleksiyasi — Kashmir Decor Toshkent" }],
  },
  twitter: { card: "summary_large_image", title: pageSeo.title, description: pageSeo.description, images: ["/assets/curtain-01.jpg"] },
  robots: { index: true, follow: true },
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
