import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  toImageSrc,
  toPublicInteriorImageUrl,
} from "../src/lib/media";

const STORED_A = "data:image/webp;base64,QUFB";
const STORED_B = "data:image/webp;base64,QkJC";
const STORED_C = "data:image/webp;base64,Q0ND";
const FALLBACK = "/assets/interior-01.jpg";

function publicRecord(id: number, primary: string, gallery: string[], version: number) {
  return {
    id,
    primary: toPublicInteriorImageUrl(id, primary, undefined, version),
    gallery: gallery.map((value, index) =>
      toPublicInteriorImageUrl(id, value, index, version),
    ),
  };
}

test("isolated A/B/C references stay scoped to the interior ID and gallery index", () => {
  const recordA = publicRecord(701, STORED_A, [STORED_B, STORED_C], 10);
  const recordB = publicRecord(702, STORED_B, [STORED_C, STORED_A], 10);
  const recordC = publicRecord(703, STORED_C, [STORED_A, STORED_B], 10);

  expect(recordA.primary).toBe("/api/media/interiors/701?v=10");
  expect(recordA.gallery).toEqual([
    "/api/media/interiors/701?gallery=0&v=10",
    "/api/media/interiors/701?gallery=1&v=10",
  ]);
  expect(recordB.primary).toBe("/api/media/interiors/702?v=10");
  expect(recordC.primary).toBe("/api/media/interiors/703?v=10");

  // The same stored value in another record still receives that record's ID;
  // there is no array-position or shared-asset lookup in the public mapping.
  expect(recordA.primary).not.toBe(recordB.primary);
  expect(recordA.gallery[0]).not.toBe(recordB.gallery[0]);
});

test("replacing A changes only the versioned A reference, not B/C selection", () => {
  const before = publicRecord(701, STORED_A, [STORED_B, STORED_C], 10);
  const after = publicRecord(701, "data:image/webp;base64,UkVQTEFDRUQtQQ==", [STORED_B, STORED_C], 11);

  expect(after.primary).toBe("/api/media/interiors/701?v=11");
  expect(after.gallery).toEqual([
    "/api/media/interiors/701?gallery=0&v=11",
    "/api/media/interiors/701?gallery=1&v=11",
  ]);
  expect(after.primary).not.toBe(before.primary);
  // B and C retain their original positions and their own record-scoped route.
  expect(after.gallery[0]).toContain("/api/media/interiors/701?gallery=0");
  expect(after.gallery[1]).toContain("/api/media/interiors/701?gallery=1");
});

test("a stored source is never replaced with an interior fallback", () => {
  const oversizedStored = `data:image/webp;base64,${"A".repeat(300_000)}`;
  expect(toImageSrc(STORED_A, FALLBACK)).toBe(STORED_A);
  expect(toImageSrc(oversizedStored, FALLBACK)).toBe(oversizedStored);
  expect(toImageSrc(null, FALLBACK)).toBe(FALLBACK);

  const mediaImage = readFileSync("src/app/components/MediaImage.tsx", "utf8");
  expect(mediaImage).toContain("const current = failedSource === resolved ? null : resolved;");
  expect(mediaImage).toContain("className={`absolute inset-0 bg-panel ${className}`}");
  expect(mediaImage).toContain("isInteriorMediaRoute");

  const serviceWorker = readFileSync("public/sw.js", "utf8");
  expect(serviceWorker).toContain('url.pathname.startsWith("/api")');

  for (const file of [
    "src/app/components/Interiors.tsx",
    "src/app/interiors/InteriorsListClient.tsx",
    "src/app/interiors/[slug]/page.tsx",
    "src/app/interiors/[slug]/InteriorDetailClient.tsx",
    "src/app/gallery/page.tsx",
  ]) {
    expect(readFileSync(file, "utf8"), file).not.toMatch(/ASSETS\.interiors|fallbackImage/);
  }
});
