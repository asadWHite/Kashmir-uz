import type { Metadata } from "next";
import { getActiveInteriors, getSettings } from "@/lib/data";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import InteriorsListClient from "./InteriorsListClient";
import type { InteriorView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Interiors",
  description: "Interior projects by KASHMIR DECOR — architectural spaces where curtain, surface and proportion meet.",
  alternates: { canonical: "/interiors" },
};

export default async function InteriorsPage() {
  const interiorList = await getActiveInteriors();
  const settings = await getSettings();

  const interiors: InteriorView[] = interiorList.map((i) => ({
    id: i.id, title: i.title, slug: i.slug, description: i.description,
    imageUrl: i.imageUrl, location: i.location, isFeatured: i.isFeatured, sortOrder: i.sortOrder,
  }));

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <InteriorsListClient interiors={interiors} />
      </main>
      <Footer settings={settings} />
      <BackToTop />
    </>
  );
}
