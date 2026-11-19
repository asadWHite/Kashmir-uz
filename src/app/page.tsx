import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getCachedCategories,
  getCachedCurtains,
  getCachedFaq,
  getCachedInteriors,
  getCachedStatistics,
} from "@/lib/data";
import { getRequestLocale } from "@/lib/locale/server";
import { HOME_SEO, OG_LOCALE, localizedAlternates, socialMeta } from "@/lib/seo";
import type { Locale } from "@/lib/i18n";

import Loader from "@/app/components/Loader";
import Navbar from "@/app/components/Navbar";
import Cursor from "@/app/components/Cursor";
import BackToTop from "@/app/components/BackToTop";
import Hero from "@/app/components/Hero";
import Manifesto from "@/app/components/Manifesto";
import Collection from "@/app/components/Collection";
import Interiors from "@/app/components/Interiors";
import Blinds from "@/app/components/Blinds";
import { getCachedBlinds } from "@/lib/blind-data";
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
  const isDefault = locale === "ru";
  return {
    title: isDefault ? undefined : copy.title,
    description: isDefault ? undefined : copy.description,
    alternates: localizedAlternates("/"),
    ...(isDefault
      ? {}
      : {
          openGraph: {
            ...socialMeta(copy.title, copy.description, "/").openGraph,
            locale: OG_LOCALE[locale as Locale],
          },
        }),
    other: { "content-language": locale },
  };
}

/**
 * Below-the-fold data sections resolve on their own, streamed in place.
 *
 * The hero and the shell above it render from the first byte; a slow or cold
 * database read for products, interiors, statistics or FAQ can therefore never
 * delay the main content. Every dataset is localized for this visitor and
 * cached per locale + content revision. Section order is unchanged, and since
 * each section sits below the fold (the hero occupies the first viewport), a
 * streamed insert cannot shift anything the visitor is looking at.
 */
async function CollectionSection({ locale }: { locale: Locale }) {
  const [curtains, categories] = await Promise.all([
    getCachedCurtains(locale),
    getCachedCategories(locale),
  ]);
  return <Collection curtains={curtains} categories={categories} />;
}

async function InteriorsSection({ locale }: { locale: Locale }) {
  return <Interiors interiors={await getCachedInteriors(locale)} />;
}

async function BlindsSection({ locale }: { locale: Locale }) {
  return <Blinds products={await getCachedBlinds(locale)} locale={locale} />;
}

async function StatisticsSection({ locale }: { locale: Locale }) {
  return <Statistics stats={await getCachedStatistics(locale)} />;
}

async function FaqSection({ locale }: { locale: Locale }) {
  return <FaqAccordion items={await getCachedFaq(locale)} />;
}

export default async function HomePage() {
  const locale = await getRequestLocale();

  return (
    <>
      <Loader />
      <Navbar />
      <Cursor />
      <main>
        <Hero />
        <Manifesto />
        <Suspense fallback={null}>
          <CollectionSection locale={locale} />
        </Suspense>
        <Suspense fallback={null}>
          <InteriorsSection locale={locale} />
        </Suspense>
        <Suspense fallback={null}>
          <BlindsSection locale={locale} />
        </Suspense>
        <Suspense fallback={null}>
          <StatisticsSection locale={locale} />
        </Suspense>
        <About />
        <Process />
        <Suspense fallback={null}>
          <FaqSection locale={locale} />
        </Suspense>
        <LocationSection />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
