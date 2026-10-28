"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import { BRAND, ASSETS } from "@/lib/constants";
import { getHomeSeo } from "@/lib/seo";
import { useT } from "./I18nProvider";
import type { Locale } from "@/lib/i18n";
import type { CurtainView, InteriorView, StatView, SettingsView } from "@/lib/types";

/* -------------------------------- Loader -------------------------------- */
export function Loader() {
  const { t } = useT();
  const [gone, setGone] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdMs = reduce ? 200 : 1500;
    const fadeMs = reduce ? 150 : 800;

    document.body.style.overflow = "hidden";
    const t1 = window.setTimeout(() => setGone(true), holdMs);
    const t2 = window.setTimeout(() => {
      setRemoved(true);
      document.body.style.overflow = "";
    }, holdMs + fadeMs);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  if (removed) return null;
  const letters = BRAND.name.split("");

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-base transition-opacity duration-700 ${
        gone ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex overflow-hidden">
        {letters.map((l, i) => (
          <span
            key={i}
            className="font-display text-[clamp(2rem,7vw,4.5rem)] tracking-[0.3em] text-ink"
            style={{
              animation: "ks-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
              animationDelay: `${0.1 + i * 0.06}s`,
              paddingLeft: i === 0 ? "0.3em" : 0,
            }}
          >
            {l}
          </span>
        ))}
      </div>
      <div className="mt-7 h-px w-40 origin-left overflow-hidden bg-line">
        <span
          className="block h-full w-full origin-left bg-ink"
          style={{ animation: "ks-bar 1.2s cubic-bezier(0.65,0,0.35,1) both", animationDelay: "0.2s" }}
        />
      </div>
      <p
        className="eyebrow mt-5 opacity-0"
        style={{ animation: "ks-fade-in 0.8s ease 0.7s both" }}
      >
        {t("loader.sub")}
      </p>
    </div>
  );
}

/* -------------------------------- Cursor -------------------------------- */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);

    const dot = document.createElement("div");
    const ring = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "6px",
      height: "6px",
      borderRadius: "999px",
      background: "var(--c-ink)",
      pointerEvents: "none",
      zIndex: "9999",
      transform: "translate(-50%, -50%)",
      mixBlendMode: "difference",
    } as CSSStyleDeclaration);
    Object.assign(ring.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "38px",
      height: "38px",
      borderRadius: "999px",
      border: "1px solid var(--c-line-strong)",
      pointerEvents: "none",
      zIndex: "9999",
      transform: "translate(-50%, -50%)",
      transition: "width .3s ease, height .3s ease, opacity .3s ease, background-color .3s ease",
      opacity: "0.6",
    } as CSSStyleDeclaration);
    document.body.append(dot, ring);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      const target = e.target as HTMLElement | null;
      const interactive = !!target?.closest("a, button, [data-cursor]");
      const size = interactive ? 64 : 38;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.opacity = interactive ? "0.9" : "0.55";
      ring.style.backgroundColor = interactive
        ? "color-mix(in srgb, var(--c-ink) 8%, transparent)"
        : "transparent";
    };

    const onLeave = () => (ring.style.opacity = "0");
    const onEnter = () => (ring.style.opacity = "0.55");

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
      dot.remove();
      ring.remove();
    };
  }, []);

  if (!enabled) return null;
  return null;
}

/* --------------------------------- Hero --------------------------------- */
export function Hero() {
  const { t, locale } = useT();
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { title, description } = getHomeSeo(locale);
    document.title = title;
    const assign = (selector: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute("content", value);
    };
    assign('meta[name="description"]', description);
    assign('meta[property="og:title"]', title);
    assign('meta[property="og:description"]', description);
    assign('meta[name="twitter:title"]', title);
    assign('meta[name="twitter:description"]', description);
  }, [locale]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      if (bgRef.current && y < window.innerHeight) {
        bgRef.current.style.transform = `translate3d(0, ${y * 0.2}px, 0) scale(1.06)`;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      <div ref={bgRef} className="absolute inset-0 -z-20" style={{ transform: "scale(1.06)" }}>
        <img
          src={ASSETS.hero}
          alt="Шторы в Ташкенте — Kashmir Decor"
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
      </div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/15 to-black/65" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 38%, transparent 35%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      <div className="container-edge relative text-center text-[#F5F0EB]">
        <p
          className="eyebrow anim-fade-up"
          style={{ animationDelay: "0.5s", color: "rgba(245,240,235,0.75)" }}
        >
          {t("hero.eyebrow")}
        </p>
        <p
          className="mt-6 font-display anim-fade-up"
          style={{
            animationDelay: "0.66s",
            fontSize: "clamp(3.2rem, 14vw, 12rem)",
            lineHeight: 0.88,
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
          aria-hidden="true"
        >
          {BRAND.name}
        </p>
        <h1
          className="mx-auto mt-8 max-w-3xl font-display anim-fade-up"
          style={{
            animationDelay: "0.78s",
            fontSize: "clamp(1.35rem, 3.4vw, 2.25rem)",
            lineHeight: 1.2,
            letterSpacing: "0.04em",
            fontWeight: 500,
          }}
        >
          {t("hero.seoTitle")}
        </h1>
        <p
          className="mx-auto mt-6 max-w-xl text-pretty anim-fade-up text-base md:text-lg"
          style={{ animationDelay: "0.92s", color: "rgba(245,240,235,0.82)" }}
        >
          {t("hero.statement")}
        </p>
      </div>

      <div
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 anim-fade-in"
        style={{ animationDelay: "1.2s" }}
      >
        <span className="text-[0.62rem] uppercase tracking-[0.4em] text-white/60">
          {t("hero.scroll")}
        </span>
        <span className="relative block h-12 w-px overflow-hidden bg-white/25">
          <span
            className="absolute left-0 top-0 block h-4 w-px bg-white"
            style={{ animation: "ks-fade-up 1.6s ease-in-out infinite" }}
          />
        </span>
      </div>
    </section>
  );
}

/* ------------------------------- Manifesto ------------------------------ */
const MARQUEE = ["Architecture", "Textile", "Light", "Craft", "Proportion", "Quiet luxury"];

export function Manifesto() {
  const { t } = useT();
  return (
    <section className="container-edge py-20 md:py-28">
      <div className="relative mb-16 overflow-hidden border-y border-line py-4 md:py-5">
        <div
          className="flex w-max items-center gap-10"
          style={{ animation: "ks-marquee 32s linear infinite" }}
        >
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((w, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="font-display text-lg tracking-wide text-muted md:text-xl">
                {w}
              </span>
              <span className="text-faint">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-4xl">
        <Reveal>
          <p className="eyebrow mb-6">{t("manifesto.label")}</p>
        </Reveal>
        <Reveal delay={80}>
          <p className="font-display text-[clamp(1.6rem,4vw,3.1rem)] leading-[1.22] text-ink">
            {t("about.title")}.
          </p>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {t("about.text")}
          </p>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-10 font-display text-sm uppercase tracking-[0.3em] text-faint">
            — {BRAND.full}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- Trending ------------------------------- */
export function Trending({ curtains }: { curtains: CurtainView[] }) {
  const { t, tc } = useT();
  const liked = curtains.filter((c) => c.likes > 0);
  if (liked.length === 0) return null;
  const sorted = [...liked].sort((a, b) => b.likes - a.likes);

  return (
    <section className="border-y border-line bg-panel py-16 md:py-20">
      <div className="container-edge">
        <div className="flex items-end justify-between">
          <div>
            <Reveal>
              <p className="eyebrow mb-3 text-accent">{t("trending.eyebrow")}</p>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-tight text-ink">
                {t("trending.title")}
              </h2>
            </Reveal>
          </div>
        </div>

        <div className="no-scrollbar mt-10 flex gap-5 overflow-x-auto pb-2">
          {sorted.map((c, i) => {
            const img = c.imageUrl || ASSETS.curtains[i % ASSETS.curtains.length];
            return (
              <Reveal key={c.id} delay={i * 50}>
                <Link
                  href={`/curtains/${c.slug}`}
                  className="group block w-[16rem] shrink-0 sm:w-[18rem]"
                >
                  <div className="zoom-frame relative aspect-[4/5] overflow-hidden bg-surface">
                    <img src={img} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 bg-ink/85 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-base">
                      #{i + 1}
                    </span>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-base/85 px-2.5 py-1 text-xs text-ink backdrop-blur">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12 19 16.5 12 21 12 21Z" />
                      </svg>
                      {c.likes}
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-lg text-ink transition-colors group-hover:text-accent">
                    {tc(c.slug, "name", c.name)}
                  </h3>
                  {c.category && <span className="eyebrow">{c.category}</span>}
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Interiors ------------------------------ */
const LAYOUT = [
  { span: "lg:col-span-7", start: "", mt: "" },
  { span: "lg:col-span-4", start: "lg:col-start-9", mt: "lg:mt-32" },
  { span: "lg:col-span-6", start: "lg:col-start-2", mt: "lg:mt-16" },
  { span: "lg:col-span-5", start: "lg:col-start-8", mt: "" },
];

export function Interiors({ interiors }: { interiors: InteriorView[] }) {
  const { t, ti } = useT();
  const layersRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !fine || interiors.length === 0) return;
    let raf = 0;
    const update = () => {
      const vh = window.innerHeight;
      for (const img of layersRef.current) {
        if (!img) continue;
        const rect = img.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        img.style.transform = `translateY(calc(-6% + ${center * -0.03}px))`;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [interiors.length]);

  return (
    <section id="interiors" className="py-24 md:py-32">
      <div className="container-edge mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal>
            <p className="eyebrow mb-4">{t("interiors.eyebrow")}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-ink">
              {t("interiors.title")}
            </h2>
          </Reveal>
        </div>
        <Reveal delay={140}>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t("interiors.subtitle")}
          </p>
        </Reveal>
      </div>

      {interiors.length === 0 ? (
        <div className="container-edge">
          <p className="font-display text-2xl text-faint">{t("interiors.empty")}</p>
        </div>
      ) : (
        <div className="container-edge grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {interiors.map((it, i) => {
            const img = it.imageUrl || ASSETS.interiors[i % ASSETS.interiors.length];
            const layout = LAYOUT[i % LAYOUT.length];
            return (
              <Reveal
                key={it.id}
                delay={(i % 2) * 90}
                className={`${layout.span} ${layout.start} ${layout.mt}`}
              >
                <Link href={`/interiors/${it.slug}`} className="group relative block">
                  <div className="zoom-frame relative aspect-[4/5] overflow-hidden bg-panel">
                    <img
                      ref={(el) => {
                        layersRef.current[i] = el;
                      }}
                      src={img}
                      alt={ti(it.slug, "title", it.title)}
                      loading="lazy"
                      className="absolute inset-0 h-[112%] w-full object-cover"
                      style={{ top: "-6%" }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-70" />
                    <figcaption className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                      <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/70">
                        {ti(it.slug, "location", it.location || t("interiors.location"))}
                      </p>
                      <h3 className="mt-1 font-display text-2xl text-white md:text-3xl">
                        {ti(it.slug, "title", it.title)}
                      </h3>
                      {it.description && (
                        <p className="mt-2 max-w-md text-sm text-white/75">
                          {ti(it.slug, "desc", it.description)}
                        </p>
                      )}
                    </figcaption>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Statistics ------------------------------ */
function formatNum(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function CountUp({ value, suffix }: { value: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const num = parseFloat(value);
    const el = ref.current;
    if (!el) return;
    if (Number.isNaN(num)) {
      setDisplay(value);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !done) {
            done = true;
            const dur = 1700;
            const start = performance.now();
            const tick = (now: number) => {
              const p = Math.min((now - start) / dur, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setDisplay(formatNum(num * eased));
              if (p < 1) requestAnimationFrame(tick);
              else setDisplay(value);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function Statistics({ stats }: { stats: StatView[] }) {
  const { t, ts, tsS } = useT();
  return (
    <section className="bg-[#1E2023] text-[#F5F0EB]">
      <div className="container-edge py-24 md:py-32">
        <Reveal>
          <p
            className="mb-12 text-[0.72rem] uppercase tracking-[0.32em]"
            style={{ color: "rgba(245,240,235,0.55)" }}
          >
            {t("stats.title")}
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-y-14 md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal
              key={s.id}
              delay={i * 80}
              className={`px-1 md:px-8 ${i % 3 !== 0 ? "md:border-l" : ""} border-white/10`}
            >
              <div className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-none">
                <CountUp value={s.value} suffix={tsS(s.label, s.suffix ?? "")} />
              </div>
              <p
                className="mt-4 text-[0.7rem] uppercase tracking-[0.26em]"
                style={{ color: "rgba(245,240,235,0.6)" }}
              >
                {ts(s.label, s.label)}
              </p>
            </Reveal>
          ))}
        </div>
        {stats.length === 0 && (
          <p className="font-display text-2xl" style={{ color: "rgba(245,240,235,0.5)" }}>
            —
          </p>
        )}
      </div>
    </section>
  );
}

/* --------------------------------- About -------------------------------- */
export function About() {
  const { t, tArr } = useT();
  const services = tArr("about.services");
  return (
    <section id="about" className="container-edge py-24 md:py-32">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
        <Reveal>
          <div className="zoom-frame relative aspect-[4/5] bg-panel">
            <img
              src={ASSETS.about}
              alt="KASHMIR DECOR curtain atelier and showroom"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow mb-5">{t("about.eyebrow")}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.08] text-ink">
              {t("about.title")}
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
              {t("about.text")}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <ul className="mt-9 divide-y divide-line border-y border-line">
              {services.map((s) => (
                <li
                  key={s}
                  className="flex items-center justify-between py-3 text-sm text-ink"
                >
                  <span>{s}</span>
                  <span className="text-faint">—</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Process ------------------------------- */
export function Process() {
  const { t } = useT();
  const steps = [
    { n: "01", t: t("process.1t"), d: t("process.1d") },
    { n: "02", t: t("process.2t"), d: t("process.2d") },
    { n: "03", t: t("process.3t"), d: t("process.3d") },
    { n: "04", t: t("process.4t"), d: t("process.4d") },
    { n: "05", t: t("process.5t"), d: t("process.5d") },
  ];
  return (
    <section id="process" className="container-edge py-24 md:py-32">
      <Reveal>
        <p className="eyebrow mb-4">{t("process.eyebrow")}</p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="mb-14 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-ink">
          {t("process.title")}
        </h2>
      </Reveal>
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 70}>
            <div className="border-t border-line pt-5">
              <p className="font-display text-3xl text-faint">{s.n}</p>
              <h3 className="mt-3 font-display text-xl text-ink">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ FaqAccordion ---------------------------- */
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

export function FaqAccordion({ items }: { items: FaqItem[] }) {
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

/* ---------------------------- LocationSection --------------------------- */
export function LocationSection({ settings }: { settings: SettingsView }) {
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
