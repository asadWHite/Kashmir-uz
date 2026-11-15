import type { Metadata } from "next";
import { getCachedHomepageData } from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import { HOME_SEO, OG_LOCALE, SITE_URL, localizedAlternates, socialMeta } from "@/lib/seo";
import type { Locale } from "@/lib/i18n";
import type { FaqView } from "@/lib/types";

import Loader from "@/app/components/Loader";
import Navbar from "@/app/components/Navbar";
import Cursor from "@/app/components/Cursor";
import BackToTop from "@/app/components/BackToTop";
import Hero from "@/app/components/Hero";
import Manifesto from "@/app/components/Manifesto";
import Collection from "@/app/components/Collection";
import Interiors from "@/app/components/Interiors";
import Statistics from "@/app/components/Statistics";
import About from "@/app/components/About";
import Process from "@/app/components/Process";
import FaqAccordion from "@/app/components/FaqAccordion";
import LocationSection from "@/app/components/LocationSection";
import Contact from "@/app/components/Contact";
import Footer from "@/app/components/Footer";

/**
 * The homepage is dynamic because it depends on the visitor's language cookie.
 * Data are served from the localized content cache (src/lib/cache.ts), so the
 * per-request work is a cache lookup plus one tiny revision query rather than
 * six cold database round-trips.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = HOME_SEO[locale] ?? HOME_SEO.ru;
  return {
    title: copy.title,
    description: copy.description,
    alternates: localizedAlternates("/"),
    openGraph: {
      ...socialMeta(copy.title, copy.description, "/").openGraph,
      locale: OG_LOCALE[locale as Locale],
    },
    other: { "content-language": locale },
  };
}

/**
 * FAQPage structured data — emitted only when the database has real FAQ
 * entries for this locale. Google may display these as rich results in
 * search, improving click-through on relevant queries.
 */
function faqJsonLd(items: FaqView[]) {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export default async function HomePage() {
  const locale = await getRequestLocale();
  const { curtainList, interiorList, statList, categoryList, faqList } =
    await getCachedHomepageData(locale);

  const faqSchema = faqJsonLd(faqList);

  return (
    <>
      <Loader />
      <Navbar />
      <Cursor />
      <main>
        <Hero />
        <Manifesto />
        <Collection curtains={curtainList} categories={categoryList} />
        <Interiors interiors={interiorList} />
        <Statistics stats={statList} />
        <About />
        <Process />
        <FaqAccordion items={faqList} />
        <LocationSection />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}
