"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { useT } from "@/app/components/I18nProvider";
import { useFavorites, useRecentlyViewed } from "@/app/components/useLocalState";
import FavButton from "@/app/components/FavButton";
import type { ResolvedSettings } from "@/lib/data";

export type CurtainDetail = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  gallery: string[] | null;
  material: string | null;
  color: string | null;
  style: string | null;
  room: string | null;
  isFeatured: boolean;
  likes: number;
};

type Props = {
  curtain: CurtainDetail;
  settings: ResolvedSettings;
  img: string;
};

export default function CurtainDetailClient({ curtain, settings, img }: Props) {
  const { t } = useT();
  const { isFav, toggle } = useFavorites();
  const { track } = useRecentlyViewed();
  const fav = isFav(curtain.id);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    track(curtain.id);
  }, [curtain.id, track]);

  const gallery = Array.isArray(curtain.gallery) && curtain.gallery.length
    ? curtain.gallery
    : [img, ...Array(3).fill(img)];

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    // Generate a branded image with KASHMIR overlay for sharing.
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no ctx");

      const shareImg = new Image();
      shareImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        shareImg.onload = () => resolve();
        shareImg.onerror = () => reject();
        shareImg.src = img;
      });

      // Draw image cover
      const scale = Math.max(canvas.width / shareImg.width, canvas.height / shareImg.height);
      const w = shareImg.width * scale;
      const h = shareImg.height * scale;
      ctx.drawImage(shareImg, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);

      // Dark gradient at bottom
      const grad = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.8)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // KASHMIR text
      ctx.fillStyle = "#F5F0EB";
      ctx.font = "600 120px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("KASHMIR", canvas.width / 2, canvas.height - 200);

      // Curtain name
      ctx.font = "400 36px sans-serif";
      ctx.fillStyle = "rgba(245,240,235,0.7)";
      ctx.fillText(curtain.name, canvas.width / 2, canvas.height - 130);

      // Website URL at the very bottom
      ctx.font = "400 30px sans-serif";
      ctx.fillStyle = "rgba(245,240,235,0.5)";
      ctx.fillText("kashmir-uz.vercel.app", canvas.width / 2, canvas.height - 70);

      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
      if (blob && navigator.canShare?.({ files: [new File([blob], "kashmir.jpg", { type: "image/jpeg" })] })) {
        await navigator.share({
          files: [new File([blob], "kashmir.jpg", { type: "image/jpeg" })],
          title: `KASHMIR — ${curtain.name}`,
          text: curtain.name,
        });
        return;
      }
    } catch {
      /* canvas failed, fall through to link share */
    }

    // Fallback: link share / copy
    if (navigator.share) {
      try { await navigator.share({ title: `KASHMIR — ${curtain.name}`, url }); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    }
  }

  const specs = [
    curtain.category && { label: t("detail.category"), val: curtain.category },
    curtain.style && { label: t("detail.style"), val: curtain.style },
    curtain.material && { label: t("detail.material"), val: curtain.material },
    curtain.color && { label: t("detail.color"), val: curtain.color },
    curtain.room && { label: t("detail.room"), val: curtain.room },
  ].filter(Boolean) as { label: string; val: string }[];

  return (
    <section className="container-edge py-10 md:py-16">
      <Link href="/collections" className="eyebrow inline-block mb-8 hover:text-ink">
        ← {t("detail.back")}
      </Link>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
        {/* Gallery */}
        <div>
          <div className="zoom-frame relative aspect-[4/5] bg-panel">
            <img src={gallery[0]} alt={curtain.name} className="h-full w-full object-cover" />
            {curtain.isFeatured && (
              <span className="absolute left-4 top-4 bg-base/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.22em] text-ink backdrop-blur">
                {t("collection.featured")}
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.slice(0, 4).map((g, i) => (
                <div key={i} className="aspect-square overflow-hidden border border-line bg-panel">
                  <img src={g} alt={`${curtain.name} — curtain detail in Tashkent`} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="eyebrow mb-3">{curtain.category || BRAND.tagline}</p>
          <h1 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.05] text-ink">
            {curtain.name}
          </h1>
          {curtain.description && (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
              {curtain.description}
            </p>
          )}

          {specs.length > 0 && (
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between py-3 text-sm">
                  <dt className="text-faint">{s.label}</dt>
                  <dd className="text-ink">{s.val}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact" className="btn btn-solid">{t("detail.contact")}</a>
            <button
              type="button"
              onClick={() => toggle(curtain.id)}
              className={`btn ${fav ? "btn-solid" : "btn-ghost"}`}
            >
              {fav ? `♥ ${t("detail.favRemove")}` : `♡ ${t("detail.favAdd")}`}
            </button>
            <button type="button" onClick={share} className="btn btn-ghost">
              {copied ? t("detail.copied") : t("detail.share")}
            </button>
          </div>

          {/* Direct contact */}
          <div className="mt-8 flex gap-4 text-sm">
            <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" className="link-underline text-muted hover:text-ink">Telegram</a>
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="link-underline text-muted hover:text-ink">Instagram</a>
            <a href={settings.phoneHref} className="link-underline text-muted hover:text-ink">{settings.phone}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
