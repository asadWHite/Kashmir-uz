import type { Metadata } from "next";
import { SEO, localizedAlternates, SITE_URL, getLocalePage, OG_LOCALE } from "@/lib/seo";
import { getActiveInteriors, getSettings } from "@/lib/data";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import InteriorsListClient from "./InteriorsListClient";
import type { InteriorView } from "@/lib/types";

export const dynamic = "force-dynamic";

const pageSeo = getLocalePage(SEO.interiors, "uz");

export const metadata: Metadata = {
  title: pageSeo.title,
  description: pageSeo.description,
  keywords: [
    "interyer pardalari",
    "Toshkentda pardalar",
    "interyer loyihalari",
    "interyer dizayni Toshkent",
    "mehmonxona pardalari",
    "yotoqxona pardalari",
    "interior curtains Tashkent",
  ],
  alternates: localizedAlternates("/interiors"),
  openGraph: {
    type: "website",
    url: `${SITE_URL}/interiors`,
    title: pageSeo.title,
    description: pageSeo.description,
    siteName: "Kashmir Decor",
    locale: OG_LOCALE.uz,
    images: [{ url: "/assets/interior-01.jpg", width: 1600, height: 1000, alt: "Interyer loyihalari — Kashmir Decor Toshkent" }],
  },
  twitter: { card: "summary_large_image", title: pageSeo.title, description: pageSeo.description, images: ["/assets/interior-01.jpg"] },
  robots: { index: true, follow: true },
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
