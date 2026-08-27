import type { MetadataRoute } from "next";
import { getActiveCurtains, getActiveInteriors } from "@/lib/data";

// The sitemap is backed by the same active content shown on the public site.
// Keep it dynamic so newly added/edited catalog entries are not stuck in a
// previously generated response.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://kashmirdecor.uz"
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [curtains, interiors] = await Promise.all([
    getActiveCurtains(),
    getActiveInteriors(),
  ]);

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/interiors`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/gallery`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...curtains.map((curtain) => ({
      url: `${base}/curtains/${curtain.slug}`,
      lastModified: curtain.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...interiors.map((interior) => ({
      url: `${base}/interiors/${interior.slug}`,
      lastModified: interior.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
// cache refresh
