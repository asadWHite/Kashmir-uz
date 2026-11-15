import type { Metadata } from "next";
import { INTERIORS_SEO, OG_LOCALE, localizedAlternates, socialMeta } from "@/lib/seo";
import { getCachedInteriors } from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import BackToTop from "@/app/components/BackToTop";
import InteriorsListClient from "./InteriorsListClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = INTERIORS_SEO[locale] ?? INTERIORS_SEO.ru;
  return {
    title: copy.title,
    description: copy.description,
    alternates: localizedAlternates("/interiors"),
    ...socialMeta(copy.title, copy.description, "/interiors"),
    openGraph: {
      ...socialMeta(copy.title, copy.description, "/interiors").openGraph,
      locale: OG_LOCALE[locale],
    },
    other: { "content-language": locale },
  };
}

export default async function InteriorsPage() {
  const locale = await getRequestLocale();
  const interiors = await getCachedInteriors(locale);

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <InteriorsListClient interiors={interiors} />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
