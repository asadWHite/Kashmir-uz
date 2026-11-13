"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { useT } from "./I18nProvider";
import type { FaqView } from "@/lib/types";

/**
 * FAQ items arrive from the server already resolved for the visitor's
 * language (src/lib/data.ts → getActiveFaq), so there is no per-item language
 * picking here — which is what previously let an Uzbek visitor see the English
 * answer whenever the Uzbek column happened to be empty.
 */
export default function FaqAccordion({ items }: { items: FaqView[] }) {
  const { t } = useT();
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
                  {item.question}
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
                    {item.answer}
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
