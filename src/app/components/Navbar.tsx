"use client";

import { useEffect, useState } from "react";
import { BRAND, NAV_LINKS } from "@/lib/constants";
import { useT } from "./I18nProvider";
import ThemeToggle from "./ThemeToggle";
import SoundToggle from "./SoundToggle";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "border-b border-line bg-base/80 backdrop-blur-md" : "border-b border-transparent"
        }`}
        style={{ animation: "ks-fade-in 1s ease 0.5s both" }}
      >
        <nav className="container-edge flex h-16 items-center justify-between md:h-20">
          <a
            href="#top"
            className="font-display text-xl tracking-[0.32em] text-ink md:text-2xl"
            aria-label={`${BRAND.full} — home`}
          >
            {BRAND.name}
          </a>

          <div className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="link-underline text-[0.82rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
              >
                {t(l.tKey)}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher className="mr-1" />
            <SoundToggle />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
              aria-expanded={open}
              className="ml-1 grid h-9 w-9 place-items-center text-ink md:hidden"
            >
              <div className="flex flex-col gap-[5px]">
                <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
                <span className={`h-px w-5 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
                <span className={`h-px w-5 bg-current transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
              </div>
            </button>
          </div>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-40 flex flex-col bg-base transition-all duration-500 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="container-edge flex h-16 items-center justify-between" />
        <div className="container-edge flex flex-1 flex-col justify-center gap-2">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-4xl tracking-tight text-ink"
              style={{
                transform: open ? "translateY(0)" : "translateY(16px)",
                opacity: open ? 1 : 0,
                transitionDelay: open ? `${0.1 + i * 0.06}s` : "0s",
              }}
            >
              {t(l.tKey)}
            </a>
          ))}
        </div>
        <div className="container-edge pb-10 text-sm text-muted">
          <p className="eyebrow mb-3">{t("contact.with")}</p>
          <p>{BRAND.full}</p>
        </div>
      </div>
    </>
  );
}
