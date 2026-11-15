"use client";

import MediaImage from "@/app/components/MediaImage";
import { IMAGE_SIZES } from "@/lib/media";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BRAND } from "@/lib/constants";
import { useSettings, useT } from "@/app/components/I18nProvider";
import { useFavorites, useRecentlyViewed } from "@/app/components/useLocalState";
import { imageReferenceIdentity, normalizeCurtainGallery } from "@/lib/curtain-gallery";

export type CurtainDetail = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  /** Usually read-path normalized; the guard also accepts legacy null payloads. */
  gallery: string[] | null;
  material: string | null;
  color: string | null;
  style: string | null;
  room: string | null;
  isFeatured: boolean;
  likes: number;
};

type Props = {
  /** Already localized and gallery-normalized on the server. */
  curtain: CurtainDetail;
};

export default function CurtainDetailClient({ curtain }: Props) {
  const { t } = useT();
  const settings = useSettings();
  const { isFav, toggle } = useFavorites();
  const { track } = useRecentlyViewed();
  const fav = isFav(curtain.id);
  const [copied, setCopied] = useState(false);

  const gallerySources = useMemo(
    // Keep a client-side guard as well: a stale RSC payload or direct caller
    // cannot reintroduce malformed/duplicate references into the DOM.
    () => normalizeCurtainGallery(curtain.imageUrl, curtain.gallery),
    [curtain.imageUrl, curtain.gallery],
  );
  const galleryImages = useMemo(
    () => gallerySources.map((source) => ({ id: imageReferenceIdentity(source), source })),
    [gallerySources],
  );
  const gallerySignature = galleryImages.map((image) => image.id).join("\u001f");
  const firstImageId = galleryImages[0]?.id ?? null;
  const [selectedImageId, setSelectedImageId] = useState<string | null>(firstImageId);
  const [imageLoading, setImageLoading] = useState(Boolean(firstImageId));
  const [imageError, setImageError] = useState(!firstImageId);

  useEffect(() => {
    track(curtain.id);
  }, [curtain.id, track]);

  // A client navigation can reuse this component instance. Reset the selected
  // source whenever the product/gallery identity changes so the main image and
  // active thumbnail can never belong to the previous curtain.
  useEffect(() => {
    setSelectedImageId(firstImageId);
    setImageLoading(Boolean(firstImageId));
    setImageError(!firstImageId);
  }, [curtain.id, gallerySignature, firstImageId]);

  const selectedImage =
    galleryImages.find((image) => image.id === selectedImageId) ?? galleryImages[0] ?? null;

  function selectImage(id: string) {
    if (id === selectedImageId) return;
    setSelectedImageId(id);
    setImageLoading(true);
    setImageError(false);
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareSource = selectedImage?.source ?? null;

    // Generate a branded image with KASHMIR overlay for sharing when the
    // selected curtain source is actually available. Never substitute another
    // product's asset when this row has no image.
    if (shareSource) {
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
          shareImg.src = shareSource;
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

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
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
    }

    // Fallback: link share / copy
    if (navigator.share) {
      try {
        await navigator.share({ title: `KASHMIR — ${curtain.name}`, url });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
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
      <Link href="/collections" className="eyebrow mb-8 inline-block hover:text-ink">
        ← {t("detail.back")}
      </Link>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
        {/* Gallery */}
        <div>
          <div className="zoom-frame relative aspect-[4/5] bg-panel"
            aria-busy={imageLoading}
            data-image-state={imageError ? "error" : imageLoading ? "loading" : "ready"}
          >
            <MediaImage
              src={selectedImage?.source}
              alt={curtain.name}
              recordType="curtain"
              recordId={curtain.id}
              galleryIndex={selectedImage ? galleryImages.indexOf(selectedImage) : undefined}
              sizes={IMAGE_SIZES.detail}
              priority
              className="object-cover"
              onLoad={() => {
                setImageLoading(false);
                setImageError(false);
              }}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
            {curtain.isFeatured && (
              <span className="absolute left-4 top-4 bg-base/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.22em] text-ink backdrop-blur">
                {t("collection.featured")}
              </span>
            )}
          </div>
          {galleryImages.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {/* `relative` is required: next/image `fill` renders
                  position:absolute, so the thumbnails stay in their boxes. */}
              {galleryImages.map((image, index) => {
                const active = image.id === selectedImage?.id;
                return (
                  <button
                    type="button"
                    key={image.id}
                    onClick={() => selectImage(image.id)}
                    className={`relative aspect-square overflow-hidden border bg-panel ${
                      active ? "border-ink" : "border-line"
                    }`}
                    aria-label={`${curtain.name}, image ${index + 1}`}
                    aria-current={active ? "true" : undefined}
                  >
                    <span className="absolute inset-0">
                      <MediaImage
                        src={image.source}
                        alt={`${curtain.name} ${index + 1}`}
                        recordType="curtain"
                        recordId={curtain.id}
                        galleryIndex={index}
                        sizes={IMAGE_SIZES.thumb}
                        className="object-cover"
                      />
                    </span>
                  </button>
                );
              })}
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
