import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInteriorBySlug, getSettings } from "@/lib/data";
import { ASSETS } from "@/lib/constants";
import InteriorDetailClient from "./InteriorDetailClient";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const interior = await getInteriorBySlug(slug);
  if (!interior) return { title: "Not found" };
  const title = interior.title;
  const desc = interior.description || `${interior.title} — KASHMIR interior project.`;
  const img = interior.imageUrl || ASSETS.interiors[0];
  const socialImage = img.startsWith("data:") ? ASSETS.interiors[0] : img;
  const canonical = `${SITE_URL}/interiors/${encodeURIComponent(interior.slug)}`;
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${title} · KASHMIR`,
      description: desc,
      url: canonical,
      images: [{ url: socialImage, width: 1600, height: 1000, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [socialImage],
    },
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
    </>
  );
}
