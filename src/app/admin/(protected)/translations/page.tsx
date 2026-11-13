import { and, asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { categories, curtains, faq, gallery, interiors, siteSettings, statistics } from "@/db/schema";
import { contentTranslations } from "@/db/schema";
import { completeness, groupTranslations, REQUIRED_FIELDS } from "@/lib/content";
import { LOCALES, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const LOCALE_NAME: Record<Locale, string> = { uz: "Uzbek", ru: "Русский", en: "English" };

type Row = {
  id: number;
  label: string;
  missing: Locale[];
  needsReview: Locale[];
};

async function loadTranslations(entity: string, ids: number[]) {
  if (ids.length === 0) return new Map<number, ReturnType<typeof groupTranslations>>();
  const rows = await db
    .select({
      entity: contentTranslations.entity,
      entityId: contentTranslations.entityId,
      locale: contentTranslations.locale,
      title: contentTranslations.title,
      subtitle: contentTranslations.subtitle,
      description: contentTranslations.description,
      seoTitle: contentTranslations.seoTitle,
      seoDescription: contentTranslations.seoDescription,
      reviewStatus: contentTranslations.reviewStatus,
    })
    .from(contentTranslations)
    .where(and(eq(contentTranslations.entity, entity), inArray(contentTranslations.entityId, ids)));

  const map = new Map<number, ReturnType<typeof groupTranslations>>();
  const grouped = new Map<number, typeof rows>();
  for (const row of rows) {
    grouped.set(row.entityId, [...(grouped.get(row.entityId) ?? []), row]);
  }
  for (const [id, list] of grouped) map.set(id, groupTranslations(list));
  return map;
}

function summarize(
  entity: keyof typeof REQUIRED_FIELDS,
  rows: Array<{ id: number; label: string }>,
  translations: Map<number, ReturnType<typeof groupTranslations>>,
): Row[] {
  return rows.map((row) => {
    const result = completeness(translations.get(row.id) ?? {}, REQUIRED_FIELDS[entity]);
    return {
      id: row.id,
      label: row.label,
      missing: result.missingLocales,
      needsReview: result.needsReview,
    };
  });
}

function Table({ title, rows, href }: { title: string; rows: Row[]; href: string }) {
  const incomplete = rows.filter((r) => r.missing.length > 0 || r.needsReview.length > 0);
  return (
    <section className="border border-line bg-surface">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-display text-lg text-ink">{title}</h2>
        <span className="text-xs text-faint">
          {rows.length - incomplete.length}/{rows.length} полностью готово
        </span>
      </header>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-faint">Нет записей.</p>
      ) : incomplete.length === 0 ? (
        <p className="p-4 text-sm text-emerald-600">Все языки заполнены и проверены.</p>
      ) : (
        <ul className="divide-y divide-line">
          {incomplete.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span className="text-sm text-ink">{row.label}</span>
              <span className="flex flex-wrap items-center gap-1 text-[0.65rem]">
                {row.missing.map((l) => (
                  <span key={`m-${l}`} className="rounded bg-red-500/15 px-1.5 py-0.5 text-red-500">
                    нет: {LOCALE_NAME[l]}
                  </span>
                ))}
                {row.needsReview.map((l) => (
                  <span key={`r-${l}`} className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-600">
                    проверить: {LOCALE_NAME[l]}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <footer className="border-t border-line px-4 py-3">
        <Link href={href} className="text-xs text-muted underline hover:text-ink">
          Открыть раздел →
        </Link>
      </footer>
    </section>
  );
}

export default async function TranslationsReportPage() {
  const [curtainRows, interiorRows, categoryRows, faqRows, statisticRows, galleryRows, settingsRows] =
    await Promise.all([
      db.select({ id: curtains.id, label: curtains.name }).from(curtains).orderBy(asc(curtains.id)),
      db.select({ id: interiors.id, label: interiors.title }).from(interiors).orderBy(asc(interiors.id)),
      db.select({ id: categories.id, label: categories.name }).from(categories).orderBy(asc(categories.id)),
      db.select({ id: faq.id, label: faq.questionEn }).from(faq).orderBy(asc(faq.id)),
      db.select({ id: statistics.id, label: statistics.label }).from(statistics).orderBy(asc(statistics.id)),
      db
        .select({ id: gallery.id, label: gallery.category })
        .from(gallery)
        .orderBy(asc(gallery.sortOrder), asc(gallery.id)),
      db.select({ id: siteSettings.id, label: siteSettings.id }).from(siteSettings).limit(1),
    ]);

  const [curtainTr, interiorTr, categoryTr, faqTr, statisticTr, galleryTr, settingsTr] = await Promise.all([
    loadTranslations("curtain", curtainRows.map((r) => r.id)),
    loadTranslations("interior", interiorRows.map((r) => r.id)),
    loadTranslations("category", categoryRows.map((r) => r.id)),
    loadTranslations("faq", faqRows.map((r) => r.id)),
    loadTranslations("statistic", statisticRows.map((r) => r.id)),
    loadTranslations("gallery", galleryRows.map((r) => r.id)),
    loadTranslations("settings", [1]),
  ]);

  const groups = [
    {
      title: "Шторы",
      href: "/admin/curtains",
      rows: summarize("curtain", curtainRows, curtainTr),
    },
    {
      title: "Интерьеры",
      href: "/admin/interiors",
      rows: summarize("interior", interiorRows, interiorTr),
    },
    {
      title: "Категории",
      href: "/admin/categories",
      rows: summarize("category", categoryRows, categoryTr),
    },
    {
      title: "FAQ",
      href: "/admin/faq",
      rows: summarize("faq", faqRows, faqTr),
    },
    {
      title: "Статистика",
      href: "/admin/statistics",
      rows: summarize("statistic", statisticRows, statisticTr),
    },
    {
      title: "Галерея",
      href: "/admin/gallery",
      rows: summarize("gallery", galleryRows, galleryTr),
    },
    {
      title: "Тексты главной",
      href: "/admin/settings",
      rows: summarize(
        "settings",
        settingsRows.map((r) => ({ id: r.id, label: "Главная страница" })),
        settingsTr,
      ),
    },
  ];

  const totals = groups.reduce(
    (acc, g) => {
      for (const row of g.rows) {
        for (const locale of LOCALES) {
          if (row.missing.includes(locale)) acc.missing[locale] += 1;
          if (row.needsReview.includes(locale)) acc.review[locale] += 1;
        }
        acc.records += 1;
      }
      return acc;
    },
    {
      records: 0,
      missing: { uz: 0, ru: 0, en: 0 } as Record<Locale, number>,
      review: { uz: 0, ru: 0, en: 0 } as Record<Locale, number>,
    },
  );

  return (
    <>
      <header className="mb-8">
        <h1 className="font-display text-2xl text-ink md:text-3xl">Полнота переводов</h1>
        <p className="mt-1 text-sm text-muted">
          Всего записей: {totals.records}. Отсутствующие переводы: UZ {totals.missing.uz} · RU{" "}
          {totals.missing.ru} · EN {totals.missing.en}. Требуют проверки: UZ {totals.review.uz} ·
          RU {totals.review.ru} · EN {totals.review.en}.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <Table key={group.title} title={group.title} rows={group.rows} href={group.href} />
        ))}
      </div>
    </>
  );
}
