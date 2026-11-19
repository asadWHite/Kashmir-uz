import "server-only";
import { and, asc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blindCategories, blindImages, blinds } from "@/db/schema";
import { deleteTranslations, parseTranslations, saveTranslations, translationSummaries } from "@/lib/admin-content";
import { blindUploadCutoff } from "@/lib/blind-media";
import { BLIND_IMAGE_ID, MAX_BLIND_GALLERY_IMAGES } from "@/lib/blinds";
import { CONTENT_CACHE_TAG } from "@/lib/cache";
import { LOCALES } from "@/lib/i18n";

class CatalogError extends Error {
  constructor(message: string, readonly status = 422) { super(message); }
}

export async function blindAdminResponse(action: () => Promise<object>) {
  try {
    return NextResponse.json({ ok: true, ...await action() });
  } catch (error) {
    if (error instanceof CatalogError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    // Do not log query parameters: they may include uploaded bytes or drafts.
    const cause = error instanceof Error ? error.cause : undefined;
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "23503") {
      return NextResponse.json({ ok: false, error: "Категория используется или больше не существует." }, { status: 409 });
    }
    console.error("Blind catalog write/read failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ ok: false, error: "Не удалось обновить каталог жалюзи. Повторите попытку." }, { status: 500 });
  }
}

export function catalogId(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 2_147_483_647) return value;
  throw new CatalogError("Запись не найдена.", 404);
}

export async function readCatalogBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new CatalogError("Некорректный запрос.");
  return body;
}

function translationsFor(input: unknown, category: boolean, required: boolean) {
  const parsed = parseTranslations(input);
  if (!parsed.ok) throw new CatalogError(parsed.error);
  for (const locale of LOCALES) {
    const row = parsed.value[locale];
    if (required && (!row?.title || (!category && !row.description))) {
      throw new CatalogError(category
        ? "Введите название категории на всех трёх языках."
        : "Для публикации заполните название и описание на всех трёх языках.");
    }
    if ((row?.title?.length ?? 0) > 120 || (!category && (row?.description?.length ?? 0) > 600)) {
      throw new CatalogError("Название — до 120 символов, описание — до 600 символов.");
    }
    if (row) parsed.value[locale] = { title: row.title, description: category ? null : row.description, reviewStatus: row.reviewStatus };
  }
  return parsed.value;
}

function invalidateBlinds() {
  revalidateTag(`${CONTENT_CACHE_TAG}:blinds`, { expire: 0 });
}

export async function listBlindCatalog() {
  const [products, categories] = await Promise.all([
    db.select().from(blinds).orderBy(asc(blinds.sortOrder), asc(blinds.id)),
    db.select().from(blindCategories).orderBy(asc(blindCategories.id)),
  ]);
  const ids = products.map(({ id }) => id);
  const [productText, categoryText, images] = await Promise.all([
    translationSummaries("blind", ids),
    translationSummaries("blind_category", categories.map(({ id }) => id)),
    ids.length ? db.select({ id: blindImages.id, blindId: blindImages.blindId, position: blindImages.position })
      .from(blindImages).where(inArray(blindImages.blindId, ids)).orderBy(asc(blindImages.position)) : [],
  ]);
  const imagesByProduct = new Map<number, typeof images>();
  for (const image of images) {
    if (image.blindId === null) continue;
    const photos = imagesByProduct.get(image.blindId) ?? [];
    photos.push(image);
    imagesByProduct.set(image.blindId, photos);
  }
  return {
    products: products.map((product) => {
      const photos = imagesByProduct.get(product.id) ?? [];
      return {
        ...product,
        mainImage: photos.find(({ position }) => position === 0)?.id ?? null,
        gallery: photos.filter(({ position }) => position !== null && position > 0).map(({ id }) => id),
        translations: productText.get(product.id) ?? {},
      };
    }),
    categories: categories.map((category) => ({ ...category, translations: categoryText.get(category.id) ?? {} })),
  };
}

export async function saveBlind(body: Record<string, unknown>, id?: number) {
  const { categoryId, sortOrder, isPublished, isFeatured, mainImage, gallery } = body;
  if (typeof isPublished !== "boolean" || typeof isFeatured !== "boolean" ||
      typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || Math.abs(sortOrder) > 2_147_483_647 ||
      (categoryId !== null && (typeof categoryId !== "number" || !Number.isInteger(categoryId) || categoryId < 1 || categoryId > 2_147_483_647))) {
    throw new CatalogError("Проверьте категорию, порядок и статус товара.");
  }
  const isImageId = (value: unknown): value is string => typeof value === "string" && BLIND_IMAGE_ID.test(value);
  if ((mainImage !== null && !isImageId(mainImage)) || !Array.isArray(gallery) ||
      gallery.length > MAX_BLIND_GALLERY_IMAGES || !gallery.every(isImageId)) {
    throw new CatalogError("Проверьте изображения и размер галереи.");
  }
  if (isPublished && (!mainImage || !categoryId)) {
    throw new CatalogError("Для публикации выберите категорию и загрузите главное фото.");
  }
  const positions = new Map<string, number>(gallery.map((imageId, index) => [imageId, index + 1]));
  if (mainImage) positions.set(mainImage, 0);
  if (positions.size !== gallery.length + Number(Boolean(mainImage))) throw new CatalogError("Изображения не должны повторяться.");
  const translation = translationsFor(body.translations, false, isPublished);

  const result = await db.transaction(async (tx) => {
    const values = { categoryId, sortOrder, isPublished, isFeatured };
    const [product] = id === undefined
      ? await tx.insert(blinds).values(values).returning({ id: blinds.id })
      : await tx.update(blinds).set(values).where(eq(blinds.id, id)).returning({ id: blinds.id });
    if (!product) throw new CatalogError("Товар не найден.", 404);
    const photoIds = [...positions.keys()];
    if (photoIds.length) {
      const photos = await tx.select({ id: blindImages.id }).from(blindImages)
        .where(and(inArray(blindImages.id, photoIds), or(
          eq(blindImages.blindId, product.id),
          and(isNull(blindImages.blindId), gt(blindImages.createdAt, blindUploadCutoff())),
        ))).orderBy(asc(blindImages.id)).for("update");
      if (photos.length !== photoIds.length) throw new CatalogError("Одно из изображений недоступно. Загрузите его снова.");
    }
    // Clear positions first so swapping two existing photos cannot collide.
    await tx.update(blindImages).set({ position: null }).where(eq(blindImages.blindId, product.id));
    for (const [imageId, position] of positions) {
      await tx.update(blindImages).set({ blindId: product.id, position }).where(eq(blindImages.id, imageId));
    }
    await tx.delete(blindImages).where(and(eq(blindImages.blindId, product.id), isNull(blindImages.position)));
    // PUT replaces this product's full draft, including intentionally cleared fields.
    await deleteTranslations("blind", product.id, tx);
    await saveTranslations("blind", product.id, translation, tx);
    return product;
  });
  invalidateBlinds();
  return result;
}

export async function saveBlindCategory(body: Record<string, unknown>, id?: number) {
  const translation = translationsFor(body.translations, true, true);
  const result = await db.transaction(async (tx) => {
    const [category] = id === undefined
      ? await tx.insert(blindCategories).values({}).returning()
      : await tx.select().from(blindCategories).where(eq(blindCategories.id, id)).for("update");
    if (!category) throw new CatalogError("Категория не найдена.", 404);
    await saveTranslations("blind_category", category.id, translation, tx);
    return category;
  });
  invalidateBlinds();
  return result;
}

export async function deleteBlindEntry(id: number, category = false) {
  await db.transaction(async (tx) => {
    const table = category ? blindCategories : blinds;
    const [removed] = await tx.delete(table).where(eq(table.id, id)).returning({ id: table.id });
    if (!removed) throw new CatalogError("Запись не найдена.", 404);
    await deleteTranslations(category ? "blind_category" : "blind", id, tx);
  });
  invalidateBlinds();
}
