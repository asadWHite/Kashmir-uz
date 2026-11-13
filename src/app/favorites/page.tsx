import type { Metadata } from "next";
import { getCachedCurtains } from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import FavoritesClient from "./FavoritesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your saved KASHMIR curtain styles.",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const locale = await getRequestLocale();
  const curtains = await getCachedCurtains(locale);

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <FavoritesClient curtains={curtains} />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
