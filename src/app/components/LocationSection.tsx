"use client";

import Reveal from "./Reveal";
import { useT } from "./I18nProvider";
import type { SettingsView } from "@/lib/types";

export default function LocationSection({ settings }: { settings: SettingsView }) {
  const { t } = useT();
  return (
    <section id="location" className="bg-panel py-24 md:py-32">
      <div className="container-edge grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <Reveal>
            <p className="eyebrow mb-5">{t("location.eyebrow")}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.08] text-ink">
              {t("location.title")}
            </h2>
          </Reveal>

          <Reveal delay={150}>
            <dl className="mt-9 space-y-7">
              <div>
                <dt className="eyebrow mb-1.5">{t("location.address")}</dt>
                <dd className="text-ink">{settings.address}</dd>
              </div>
              <div>
                <dt className="eyebrow mb-1.5">{t("location.hours")}</dt>
                <dd className="text-ink">{settings.workingHours}</dd>
              </div>
              <div>
                <dt className="eyebrow mb-1.5">{t("location.phone")}</dt>
                <dd>
                  <a href={settings.phoneHref} className="link-underline text-ink transition-colors hover:text-accent">
                    {settings.phone}
                  </a>
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={220}>
            <a
              href={settings.mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-solid mt-9"
            >
              {t("location.directions")}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 11 11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <a
            href={settings.mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open map directions"
            className="zoom-frame group relative block aspect-[4/3] overflow-hidden border border-line bg-surface"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, var(--c-line) 0 1px, transparent 1px 44px), repeating-linear-gradient(90deg, var(--c-line) 0 1px, transparent 1px 44px)",
            }}
          >
            <div
              className="absolute inset-0 opacity-50 transition-opacity group-hover:opacity-70"
              style={{ background: "radial-gradient(60% 60% at 50% 50%, transparent 55%, var(--c-base) 100%)" }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-base bg-accent" />
              </span>
            </div>
            <span className="absolute bottom-4 left-4 text-[0.62rem] uppercase tracking-[0.3em] text-faint">
              {settings.mapsQuery}
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
