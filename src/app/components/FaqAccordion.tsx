"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { useT } from "./I18nProvider";
import type { Locale } from "@/lib/i18n";

export type FaqItem = {
  id: number;
  questionEn: string;
  questionRu: string | null;
  questionUz: string | null;
  answerEn: string;
  answerRu: string | null;
  answerUz: string | null;
};

function pick(locale: Locale, en: string, ru: string | null, uz: string | null) {
  if (locale === "ru" && ru) return ru;
  if (locale === "uz" && uz) return uz;
  return en;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const { t, locale } = useT();
  const [openId, setOpenId] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section id="faq" className="container-edge py-24 md:py-32">
      <Reveal>
        <p className="eyebrow mb-4">{t("faq.eyebrow")}</p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="mb-12 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-ink">
          {t("faq.title")}
        </h2>
      </Reveal>
      <div className="border-t border-line">
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <div key={item.id} className="border-b border-line">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-display text-lg text-ink md:text-xl">
                  {pick(locale, item.questionEn, item.questionRu, item.questionUz)}
                </span>
                <span className={`grid h-6 w-6 shrink-0 place-items-center text-faint transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              <div
                className="grid transition-all duration-400"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="max-w-2xl pb-6 text-sm leading-relaxed text-muted md:text-base">
                    {pick(locale, item.answerEn, item.answerRu, item.answerUz)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
