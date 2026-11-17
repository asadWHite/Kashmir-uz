"use client";

import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { IMAGE_SIZES, isDataUrl, toImageSrc } from "@/lib/media";

/**
 * Record-scoped media routes serve responsive WebP variants themselves
 * (`?w=…&q=…`), so they use a custom `next/image` loader: the srcset is built
 * from real width variants of the same record URL — never `/_next/image` —
 * and the `src` stays the exact versioned record URL that maps to the stored
 * database bytes.
 */
function mediaRouteLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}w=${width}&q=${quality ?? 75}`;
}

/**
 * One image primitive for the whole public site.
 *
 * Why not `next/image` alone: the curated `/assets/*.jpg` files are 1536×1024
 * JPEGs and the stored product images may be data URLs. Both are handled here:
 *  · `next/image` produces responsive `srcset` + WebP/AVIF, so a phone never
 *    downloads a desktop-sized file, and `sizes` describes the real layout;
 *  · `loading` + `fetchPriority` are explicit, so only the hero competes for
 *    the first screen while everything below the fold stays lazy;
 *  · large interior data URLs are served through their record-scoped media
 *    endpoint instead of being inlined into the document;
 *  · an image with no explicit fallback gets a neutral placeholder on failure,
 *    never an unrelated image;
 *  · `unoptimized` is used for data URLs (which Next cannot re-encode), the
 *    ID-scoped interior media route (already Sharp-produced and versioned), and
 *    arbitrary external URLs (which are not in the app's remote allowlist).
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
  recordType,
  recordId,
  galleryIndex,
  sizes = IMAGE_SIZES.card,
  priority = false,
  eager = false,
  className = "",
  fill = true,
  width,
  height,
  onLoad,
  onError,
}: {
  /** Stored value from the database (URL, /assets path or data URL). */
  src: string | null | undefined;
  /** Optional fallback only for records with no stored source. */
  fallback?: string;
  alt: string;
  /** Redacted context for console diagnostics; never the image bytes or URL. */
  recordType?: "interior" | "curtain" | "gallery" | "asset";
  recordId?: number;
  galleryIndex?: number;
  sizes?: string;
  priority?: boolean;
  /** Above-the-fold grid images: start loading immediately (no lazy, no preload link). */
  eager?: boolean;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  const resolved = toImageSrc(src, fallback);
  // Keep the failed source, rather than the rendered source, in state. This
  // means replacing an image record immediately picks up the new URL even if
  // React preserves this component during a client navigation. A failed
  // stored image is never replaced with a different image.
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const current = failedSource === resolved ? null : resolved;
  const showPlaceholder = !current;

  useEffect(() => {
    if (!showPlaceholder) return;
    console.error("[MediaImage] stored image is unavailable; showing a neutral placeholder.", {
      recordType,
      recordId,
      galleryIndex,
      hasStoredSource: Boolean(src),
      sourceType: isDataUrl(resolved) ? "data-url" : "url",
    });
  }, [galleryIndex, recordId, recordType, resolved, showPlaceholder, src]);

  if (!current) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`absolute inset-0 bg-panel ${className}`}
      />
    );
  }

  const unoptimized = isDataUrl(current);
  const isAbsolute = /^https?:\/\//.test(current);
  // The ID-scoped media endpoints stream the Sharp-produced bytes with their
  // own versioned cache key and produce their own responsive variants via the
  // custom loader below. Bypass Next's optimizer for them: the optimizer's
  // local-query allowlist cannot express a dynamic `v` value, and direct
  // delivery keeps the browser's rendered URL equal to the verified
  // record-scoped media URL.
  const isInteriorMediaRoute = /^\/api\/media\/(interiors|curtains|gallery)\/\d+(?:\?|$)/.test(current);
  const direct = unoptimized || isAbsolute;

  const common = {
    src: current,
    alt,
    sizes,
    priority,
    // Next emits the `<link rel="preload">` for a priority image from these
    // props; without an explicit fetchPriority the hero preload loses the
    // "high" hint that the previous hand-written <img> had.
    ...(priority ? { fetchPriority: "high" as const } : {}),
    // Visible-in-first-viewport grid images start immediately instead of
    // waiting for the native lazy threshold, without a competing preload.
    ...(eager && !priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {}),
    // Record-scoped media routes build their responsive srcset from this
    // loader (`?w=…` variants of the same versioned record URL).
    ...(isInteriorMediaRoute ? { loader: mediaRouteLoader } : {}),
    // Admin URL fields also accept external images. Arbitrary remote hosts are
    // intentionally not added to `next.config.ts`; render those URLs directly
    // instead of making Next's optimizer reject the image at runtime.
    unoptimized: direct,
    className,
    onLoad,
    onError: (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (resolved) setFailedSource(resolved);
      onError?.(event as React.SyntheticEvent<HTMLImageElement>);
    },
  } as const;

    if (fill) {
      // `fill` must reach next/image itself: without it the renderer emits a
      // plain in-flow <img> (no width/height), which in dev throws the
      // missing-width error and in prod is laid out at its density-corrected
      // intrinsic size (the `sizes` hint) instead of covering the container.
      return <FillImage {...common} fill />;
    }

  return (
    <NextImage
      {...common}
      width={width ?? 1200}
      height={height ?? 1500}
      // Remote hosts are not in `images.remotePatterns`; this keeps arbitrary
      // admin-supplied URLs working exactly as the previous <img> did.
      unoptimized={direct}
    />
  );
}
