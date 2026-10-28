"use client";

import Reveal from "./Reveal";
import { BRAND, NAV_LINKS } from "@/lib/constants";
import { useT } from "./I18nProvider";
import type { SettingsView } from "@/lib/types";

export default function Footer({ settings }: { settings: SettingsView }) {
  const { t } = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="container-edge py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-display text-3xl tracking-[0.28em] text-ink md:text-4xl">
              {BRAND.name}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="eyebrow mb-5">{t("footer.explore")}</p>
            <ul className="space-y-3">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="link-underline text-sm text-muted transition-colors hover:text-ink">
                    {t(l.tKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="eyebrow mb-5">{t("footer.connect")}</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="link-underline text-muted hover:text-ink">
                  Instagram · {settings.instagramHandle}
                </a>
              </li>
              <li>
                <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" className="link-underline text-muted hover:text-ink">
                  Telegram
                </a>
              </li>
              <li>
                <a href={settings.phoneHref} className="link-underline text-muted hover:text-ink">
                  {settings.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="link-underline text-muted hover:text-ink">
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center">
          <p>© {year} {BRAND.full}. {t("footer.rights")}</p>
          <div className="flex items-center gap-5">
            <a href="/admin/login" className="link-underline hover:text-muted">
              {t("footer.login")}
            </a>
            <span>{t("footer.spelled")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
