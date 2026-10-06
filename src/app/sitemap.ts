import type { MetadataRoute } from "next";
import { getActiveCurtains, getActiveInteriors } from "@/lib/data";

// Dynamic sitemap: built at request time from live content so newly added
// curtains, interiors and SEO landing pages are always reflected. Draft
// (isActive=false) items are never exposed to crawlers.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://kashmirdecor.uz"
  );
}

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [curtains, interiors] = await Promise.all([
    getActiveCurtains(),
    getActiveInteriors(),
  ]);

  const now = new Date();

  // Core pages — highest priority.
  const core: Entry[] = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/toshkentda-pardalar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${base}/collections`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];

  // Style / category landing pages (the real SEO-optimized route set).
  const stylePages: Entry[] = [
    "zamonaviy-pardalar",
    "klassik-pardalar",
    "rim-pardalar",
    "premium-pardalar",
  ].map((slug) => ({
    url: `${base}/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Public supporting pages.
  const support: Entry[] = [
    {
      url: `${base}/interiors`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/gallery`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/haqimizda`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/kontakt`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];

  // Dynamic catalog pages — only active (isActive=true) items are emitted.
  const productEntries: Entry[] = [
    ...curtains.map((curtain) => ({
      url: `${base}/curtains/${curtain.slug}`,
      lastModified: curtain.updatedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...interiors.map((interior) => ({
      url: `${base}/interiors/${interior.slug}`,
      lastModified: interior.updatedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...core, ...stylePages, ...support, ...productEntries];
}
