"use client";

import NextImage from "next/image";
import { useState } from "react";
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
 */
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
    return <NextImage {...common} fill />;
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
