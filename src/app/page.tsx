import { getHomepageData, getActiveCategories, getActiveFaq } from "@/lib/data";
import type {
  CategoryView,
  CurtainView,
  InteriorView,
  StatView,
} from "@/lib/types";

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
import FaqAccordion, { type FaqItem } from "@/app/components/FaqAccordion";
import LocationSection from "@/app/components/LocationSection";
import Contact from "@/app/components/Contact";
import Footer from "@/app/components/Footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { curtainList, interiorList, statList, settings } = await getHomepageData();
  const categoryList = await getActiveCategories();
  const faqList = await getActiveFaq();

  const curtains: CurtainView[] = curtainList.map((c) => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description,
    category: c.category, imageUrl: c.imageUrl, material: c.material, color: c.color,
    isFeatured: c.isFeatured, likes: c.likes, sortOrder: c.sortOrder,
  }));
  const interiors: InteriorView[] = interiorList.map((i) => ({
    id: i.id, title: i.title, slug: i.slug, description: i.description,
    imageUrl: i.imageUrl, location: i.location, isFeatured: i.isFeatured, sortOrder: i.sortOrder,
  }));
  const stats: StatView[] = statList.map((s) => ({
    id: s.id, label: s.label, value: s.value, suffix: s.suffix, sortOrder: s.sortOrder,
  }));
  const categories: CategoryView[] = categoryList.map((c) => ({
    id: c.id, name: c.name, slug: c.slug, sortOrder: c.sortOrder,
  }));
  const faq: FaqItem[] = faqList.map((f) => ({
    id: f.id, questionEn: f.questionEn, questionRu: f.questionRu, questionUz: f.questionUz,
    answerEn: f.answerEn, answerRu: f.answerRu, answerUz: f.answerUz,
  }));

  return (
    <>
      <Loader />
      <Navbar />
      <Cursor />
      <main>
        <Hero />
        <Manifesto />
        <Collection curtains={curtains} categories={categories} />
        <Interiors interiors={interiors} />
        <Statistics stats={stats} />
        <About />
        <Process />
        <FaqAccordion items={faq} />
        <LocationSection settings={settings} />
        <Contact settings={settings} />
      </main>
      <Footer settings={settings} />
      <BackToTop />
    </>
  );
}
