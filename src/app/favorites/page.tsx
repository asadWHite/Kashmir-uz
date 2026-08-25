import type { Metadata } from "next";
import { getActiveCurtains, getSettings } from "@/lib/data";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import FavoritesClient from "./FavoritesClient";
import type { CurtainView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your saved KASHMIR curtain styles.",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const curtainList = await getActiveCurtains();
  const settings = await getSettings();

  const curtains: CurtainView[] = curtainList.map((c) => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description,
    category: c.category, imageUrl: c.imageUrl, material: c.material, color: c.color,
    isFeatured: c.isFeatured, likes: c.likes, sortOrder: c.sortOrder,
  }));

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <FavoritesClient curtains={curtains} />
      </main>
      <Footer settings={settings} />
      <BackToTop />
    </>
  );
}
