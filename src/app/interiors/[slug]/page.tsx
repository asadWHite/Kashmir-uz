import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInteriorBySlug, getSettings } from "@/lib/data";
import { ASSETS, BRAND } from "@/lib/constants";
import { SITE_URL, localizedAlternates, OG_LOCALE } from "@/lib/seo";
import InteriorDetailClient from "./InteriorDetailClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const interior = await getInteriorBySlug(slug);
  if (!interior) return { title: "Topilmadi", robots: { index: false } };
  const title = `${interior.title} — ${BRAND.full}`;
  const desc =
    interior.description ||
    `${interior.title} — Kashmir Decor Toshkent interyer loyihasi. Parda va interyer dizayni.`;
  const img = interior.imageUrl || ASSETS.interiors[0];
  const url = `/interiors/${interior.slug}`;
  return {
    title,
    description: desc,
    alternates: localizedAlternates(url),
    openGraph: {
      title,
      description: desc,
      url: `${SITE_URL}${url}`,
      siteName: BRAND.full,
      locale: OG_LOCALE.uz,
      images: [{ url: img, width: 1600, height: 1000, alt: `${interior.title} — Kashmir Decor Toshkent` }],
    },
    twitter: { card: "summary_large_image", title, description: desc, images: [img] },
    robots: { index: true, follow: true },
  };
}

export default async function InteriorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const interior = await getInteriorBySlug(slug);
  if (!interior) notFound();
  const settings = await getSettings();
  const img = interior.imageUrl || ASSETS.interiors[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: interior.title,
    description: interior.description || "",
    image: img.startsWith("http") ? img : `${SITE_URL}${img}`,
    author: { "@type": "Organization", name: BRAND.full },
    locationCreated: { "@type": "Place", name: "Tashkent, Uzbekistan" },
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <InteriorDetailClient
          title={interior.title}
          description={interior.description}
          location={interior.location}
          slug={interior.slug}
          imageUrl={img}
          gallery={interior.gallery}
          settings={settings}
        />
      </main>
      <Footer settings={settings} />
      <BackToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
