"use client";

import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { IMAGE_SIZES, toImageSrc } from "@/lib/media";

/**
 * One image primitive for the whole public site.
 *
 * Why not `next/image` alone: the curated `/assets/*.jpg` files are 1536×1024
 * JPEGs and the stored product images may be data URLs. Both are handled here:
 *  · `next/image` produces responsive `srcset` + WebP/AVIF, so a phone never
 *    downloads a desktop-sized file, and `sizes` describes the real layout;
 *  · `loading` + `fetchPriority` are explicit, so only the hero competes for
 *    the first screen while everything below the fold stays lazy;
 *  · a stored data URL that is too large to serve is swapped for the curated
 *    fallback instead of being inlined into the document;
 *  · `unoptimized` is only used for data URLs, which Next cannot re-encode.
 *
 * The visual result is unchanged: same crop (object-cover), same position, same
 * container aspect ratio.
 *
 * `fill` mode and containing blocks
 * ---------------------------------
 * next/image renders a `fill` image as `position:absolute; inset:0`. An
 * absolutely positioned box is positioned against its nearest *positioned*
 * ancestor, and `overflow:hidden` on a `static` ancestor does not clip it. So a
 * `fill` image whose parent is missing `relative` is laid out against the
 * initial containing block and covers the rest of the page instead of sitting
 * inside its frame.
 *
 * That is exactly what happened on product pages: gallery thumbnails sat in
 * `<div class="aspect-square overflow-hidden …">` (no `relative`), so the images
 * escaped their boxes and the product layout disappeared behind them. Every
 * call site is now explicit, and this component *checks* it: in development a
 * violation is reported loudly, so the next edit that drops `relative` fails
 * immediately instead of in production.
 */
/**
 * `fill` image plus a development-time containment assertion.
 *
 * The check is deliberately runtime and dev-only: it costs nothing in
 * production, needs no browser, and catches the real DOM nesting (including
 * classNames built from template literals, which a static grep cannot follow).
 */
function FillImage(props: React.ComponentProps<typeof NextImage>) {
  const ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let node: HTMLElement | null = ref.current?.parentElement ?? null;
    while (node && node !== document.body) {
      const position = getComputedStyle(node).position;
      if (position !== "static") return; // contained correctly
      node = node.parentElement;
    }
    console.error(
      "[MediaImage] fill image has no positioned ancestor, so it will be laid " +
        "out against the page instead of its frame. Add `relative` to the " +
        "wrapping element.",
      ref.current?.parentElement,
    );
  }, []);

  return <NextImage ref={ref} {...props} />;
}

export default function MediaImage({
  src,
  fallback,
  alt,
  sizes = IMAGE_SIZES.card,
  priority = false,
  className = "",
  fill = true,
  width,
  height,
}: {
  /** Stored value from the database (URL, /assets path or data URL). */
  src: string | null | undefined;
  /** Curated asset to use when `src` is missing or unusable. */
  fallback: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const resolved = toImageSrc(src, fallback);
  const [current, setCurrent] = useState(resolved);
  const unoptimized = current.startsWith("data:");
  const isAbsolute = /^https?:\/\//.test(current);

  const common = {
    src: current,
    alt,
    sizes,
    priority,
    // Next emits the `<link rel="preload">` for a priority image from these
    // props; without an explicit fetchPriority the hero preload loses the
    // "high" hint that the previous hand-written <img> had.
    ...(priority ? { fetchPriority: "high" as const } : {}),
    unoptimized,
    className,
    onError: () => {
      if (current !== fallback) setCurrent(fallback);
    },
  } as const;

  if (fill) {
    return <FillImage {...common} />;
  }

  return (
    <NextImage
      {...common}
      width={width ?? 1200}
      height={height ?? 1500}
      // Remote hosts are not in `images.remotePatterns`; this keeps arbitrary
      // admin-supplied URLs working exactly as the previous <img> did.
      unoptimized={unoptimized || isAbsolute}
    />
  );
}
