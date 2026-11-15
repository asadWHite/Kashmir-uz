import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  imageReferenceIdentity,
  isCurtainImageReference,
  normalizeCurtainGallery,
} from "../src/lib/curtain-gallery";

const A = "/uploads/curtains/atelier.webp";
const B = "/uploads/curtains/linen.webp";
const C = "https://cdn.example.test/curtains/graphite.webp";

test("a missing or empty gallery renders one real primary source, never four copies", () => {
  assert.deepEqual(normalizeCurtainGallery(A, null), [A]);
  assert.deepEqual(normalizeCurtainGallery(A, []), [A]);
  assert.deepEqual(normalizeCurtainGallery(A, undefined), [A]);
});

test("one, two and many unique sources keep their stored order", () => {
  assert.deepEqual(normalizeCurtainGallery(A, []), [A]);
  assert.deepEqual(normalizeCurtainGallery(A, [B]), [A, B]);
  assert.deepEqual(normalizeCurtainGallery(A, [B, C, "/uploads/curtains/fourth.webp"]), [
    A,
    B,
    C,
    "/uploads/curtains/fourth.webp",
  ]);
});

test("exact and identity-equivalent duplicate references keep the first source", () => {
  const optimizedSmall = `/_next/image?url=${encodeURIComponent(A)}&w=320&q=65`;
  const optimizedLarge = `/_next/image?url=${encodeURIComponent(A)}&w=1600&q=90`;
  assert.equal(imageReferenceIdentity(optimizedSmall), imageReferenceIdentity(optimizedLarge));
  assert.deepEqual(normalizeCurtainGallery(A, [optimizedSmall, B, optimizedLarge, A]), [A, B]);
});

test("ordinary optimizer query parameters do not create duplicate gallery slots", () => {
  const first = `${C}?width=640&quality=70&token=stable`;
  const second = `${C}?quality=90&width=1600&token=stable`;
  assert.equal(imageReferenceIdentity(first), imageReferenceIdentity(second));
  assert.deepEqual(normalizeCurtainGallery(null, [first, second]), [first]);
});

test("data URLs are compared without changing the stored winning reference", () => {
  const first = "data:image/webp;base64,QUJD\nREVGRw==";
  const equivalent = " data:image/WEBP;BASE64,QUJDREVGRw== ";
  assert.equal(imageReferenceIdentity(first), imageReferenceIdentity(equivalent));
  assert.deepEqual(normalizeCurtainGallery(null, [first, equivalent]), [first]);
});

test("malformed or unsafe references are ignored without an unrelated fallback", () => {
  assert.equal(isCurtainImageReference(null), false);
  assert.equal(isCurtainImageReference("javascript:alert(1)"), false);
  assert.equal(isCurtainImageReference("data:text/html,not-an-image"), false);
  assert.deepEqual(normalizeCurtainGallery(null, [null, 42, "", "javascript:bad", B]), [B]);
  assert.deepEqual(normalizeCurtainGallery(null, [null, 42, "javascript:bad"]), []);
});

test("the public curtain query orders featured products before manual/id order", () => {
  const source = readFileSync("src/lib/data.ts", "utf8");
  assert.match(
    source,
    /\.orderBy\(desc\(curtains\.isFeatured\), asc\(curtains\.sortOrder\), asc\(curtains\.id\)\)/,
  );
  assert.match(source, /return limit === undefined \? query : query\.limit\(limit\)/);
});

test("client listings preserve database order and keep likes for trending only", () => {
  const collection = readFileSync("src/app/components/Collection.tsx", "utf8");
  const collections = readFileSync("src/app/collections/CollectionsClient.tsx", "utf8");
  const trending = readFileSync("src/app/components/Trending.tsx", "utf8");
  assert.doesNotMatch(collection, /sort\([^)]*likes/);
  assert.doesNotMatch(collections, /sort\([^)]*likes/);
  assert.match(trending, /sort\(\(a, b\) => b\.likes - a\.likes\)/);
});

test("admin saves cannot erase a gallery with a legacy null payload", () => {
  const api = readFileSync("src/app/api/admin/curtains/[id]/route.ts", "utf8");
  const editor = readFileSync("src/app/admin/(protected)/curtains/page.tsx", "utf8");
  assert.match(api, /Array\.isArray\(body\.gallery\) \? \{ gallery: body\.gallery \} : \{\}/);
  assert.match(editor, /Array\.isArray\(draft\.gallery\) \? \{ gallery: draft\.gallery \} : \{\}/);
  assert.match(editor, /body: JSON\.stringify\(\{ \[key\]: !it\[key\] \}\)/);
  assert.doesNotMatch(editor, /JSON\.stringify\(\{ \.\.\.it, \[key\]/);
});

test("detail rendering has no fabricated slots and uses source identity for active thumbnails", () => {
  const detail = readFileSync("src/app/curtains/[slug]/CurtainDetailClient.tsx", "utf8");
  assert.doesNotMatch(detail, /Array\(3\)|fill\(img\)|gallery\.slice\(0, 4\)/);
  assert.match(detail, /imageReferenceIdentity\(source\)/);
  assert.match(detail, /onClick=\{\(\) => selectImage\(image\.id\)\}/);
  assert.match(detail, /data-image-state=/);
});

test("public curtain cards do not substitute a different curtain asset", () => {
  const files = [
    "src/app/components/Collection.tsx",
    "src/app/collections/CollectionsClient.tsx",
    "src/app/favorites/FavoritesClient.tsx",
    "src/app/curtains/[slug]/RelatedGrid.tsx",
    "src/app/gallery/page.tsx",
  ];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /ASSETS\.curtains|fallback=.*ASSETS/);
  }
});
