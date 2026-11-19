"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ImageField from "../../_components/ImageField";
import TranslationEditor, { emptyTranslations, toPayload, translationsFromApi, type FieldConfig, type TranslationsDraft } from "../../_components/TranslationEditor";
import { PageHeader } from "../../_components/ui";
import { api } from "../../_lib/fetch";
import { adminBlindImageUrl, MAX_BLIND_GALLERY_IMAGES } from "@/lib/blinds";
import type { TranslationMap } from "@/lib/content";

const ROOT = "/api/admin/blinds";
const CATEGORY_FIELDS: FieldConfig[] = [{ key: "title", label: { uz: "Kategoriya nomi", ru: "Название категории", en: "Category name" } }];
const PRODUCT_FIELDS: FieldConfig[] = [
  { key: "title", label: { uz: "Mahsulot nomi", ru: "Название товара", en: "Product name" } },
  { key: "description", label: { uz: "Qisqa tavsif", ru: "Краткое описание", en: "Short description" }, multiline: true, rows: 3 },
];

type Category = { id: number; translations: TranslationMap };
type Product = Category & { categoryId: number | null; sortOrder: number; isPublished: boolean; isFeatured: boolean; mainImage: string | null; gallery: string[] };
type Catalog = { products: Product[]; categories: Category[] };
type CategoryDraft = { id?: number; translations: TranslationsDraft };
type ProductDraft = {
  id?: number; categoryId: string; sortOrder: string; isPublished: boolean; isFeatured: boolean;
  mainImage: string; gallery: { key: number; image: string }[]; translations: TranslationsDraft;
};

const titleFor = ({ id, translations }: Category) => translations.ru?.title || translations.uz?.title || translations.en?.title || `Черновик №${id}`;
const errorText = (error: unknown) => error instanceof Error ? error.message : "Не удалось выполнить запрос.";

function PhotoField({ slot, image, label, onChange, onBusy }: {
  slot: number; image: string; label: string;
  onChange: (id: string) => void; onBusy: (slot: number, busy: boolean) => void;
}) {
  const notify = useCallback((busy: boolean) => onBusy(slot, busy), [onBusy, slot]);
  return <ImageField value={image ? adminBlindImageUrl(image) : ""} label={label} uploadScope="blind" uploadOnly
    onChange={(url) => onChange(url.split("/").pop() ?? "")} onBusyChange={notify} />;
}

export default function AdminBlindsPage() {
  const [catalog, setCatalog] = useState<Catalog>();
  const [product, setProduct] = useState<ProductDraft | null>(null);
  const [category, setCategory] = useState<CategoryDraft | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Set<number>>(() => new Set());
  const nextPhoto = useRef(1);
  const busy = saving || uploading.size > 0;

  const onUpload = useCallback((slot: number, active: boolean) => {
    setUploading((current) => {
      if (current.has(slot) === active) return current;
      const next = new Set(current);
      if (active) next.add(slot);
      else next.delete(slot);
      return next;
    });
  }, []);

  async function reload() { setCatalog(await api<Catalog>(ROOT)); }
  useEffect(() => {
    let active = true;
    api<Catalog>(ROOT).then((data) => { if (active) setCatalog(data); }, (err) => { if (active) setError(errorText(err)); });
    return () => { active = false; };
  }, []);

  function openProduct(row?: Product) {
    setError("");
    setCategory(null);
    setProduct({
      id: row?.id, categoryId: String(row?.categoryId ?? ""), sortOrder: String(row?.sortOrder ?? 0),
      isPublished: row?.isPublished ?? false, isFeatured: row?.isFeatured ?? false, mainImage: row?.mainImage ?? "",
      gallery: row?.gallery.map((image) => ({ key: nextPhoto.current++, image })) ?? [],
      translations: translationsFromApi(row?.translations),
    });
  }

  function patchProduct(patch: Partial<ProductDraft>) {
    setProduct((current) => current ? { ...current, ...patch } : current);
  }

  async function mutate(action: () => Promise<void>) {
    setSaving(true);
    setError("");
    try { await action(); await reload(); }
    catch (err) { setError(errorText(err)); }
    finally { setSaving(false); }
  }

  function saveProduct() {
    if (!product || busy) return;
    void mutate(async () => {
      await api(product.id ? `${ROOT}/${product.id}` : ROOT, {
        method: product.id ? "PUT" : "POST",
        body: JSON.stringify({
          categoryId: product.categoryId ? Number(product.categoryId) : null, sortOrder: Number(product.sortOrder),
          isPublished: product.isPublished, isFeatured: product.isFeatured,
          mainImage: product.mainImage || null, gallery: product.gallery.map(({ image }) => image).filter(Boolean),
          translations: toPayload(product.translations),
        }),
      });
      setProduct(null);
    });
  }

  function saveCategory() {
    if (!category || busy) return;
    void mutate(async () => {
      const { id } = await api<{ id: number }>(`${ROOT}/categories${category.id ? `/${category.id}` : ""}`, {
        method: category.id ? "PUT" : "POST",
        body: JSON.stringify({ translations: toPayload(category.translations) }),
      });
      if (!category.id) patchProduct({ categoryId: String(id) });
      setCategory(null);
    });
  }

  function remove(row: Category, isCategory = false) {
    if (!window.confirm(`Удалить «${titleFor(row)}»?`)) return;
    void mutate(async () => { await api(`${ROOT}${isCategory ? "/categories" : ""}/${row.id}`, { method: "DELETE" }); });
  }

  return (
    <>
      <PageHeader title="Жалюзи" sub="Каталог жалюзи на главной странице. Не влияет на каталог штор." action={
        catalog && !product && !category && <button type="button" className="btn btn-solid" disabled={busy} onClick={() => openProduct()}>Добавить товар</button>
      } />
      {error && <p role="alert" className="mb-5 border border-line p-4 text-sm text-ink">{error}</p>}
      {!catalog && (error ? <button className="btn btn-ghost" onClick={() => void mutate(async () => {})}>Повторить</button> : <p className="text-sm text-muted">Загрузка…</p>)}
      {category && (
        <form className="mb-8 max-w-3xl space-y-4 border border-line p-4 md:p-6" onSubmit={(event) => { event.preventDefault(); saveCategory(); }}>
          <h2 className="font-display text-2xl">{category.id ? "Редактирование категории" : "Новая категория"}</h2>
          <TranslationEditor value={category.translations} onChange={(translations) => setCategory({ ...category, translations })} fields={CATEGORY_FIELDS} disabled={busy} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn btn-solid" disabled={busy}>Сохранить категорию</button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setError(""); setCategory(null); }}>Отмена</button>
          </div>
        </form>
      )}
      {product && !category && (
        <form className="max-w-3xl space-y-6" onSubmit={(event) => { event.preventDefault(); saveProduct(); }}>
          <h2 className="font-display text-2xl">{product.id ? "Редактирование товара" : "Новый товар"}</h2>
          <p className="text-sm text-muted">Черновик можно сохранить в любой момент. Для публикации нужны главное фото, категория, название и описание на всех трёх языках. Избранные товары идут первыми, затем — по порядку.</p>
          <TranslationEditor value={product.translations} onChange={(translations) => patchProduct({ translations })} fields={PRODUCT_FIELDS} disabled={saving} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="eyebrow">Категория
              <select className="field" value={product.categoryId} disabled={saving} onChange={(event) => patchProduct({ categoryId: event.target.value })}>
                <option value="">Выберите категорию</option>
                {catalog?.categories.map((row) => <option key={row.id} value={row.id}>{titleFor(row)}</option>)}
              </select>
            </label>
            <label className="eyebrow">Порядок показа
              <input className="field" type="number" step="1" min={-2147483647} max={2147483647} required value={product.sortOrder} disabled={saving} onChange={(event) => patchProduct({ sortOrder: event.target.value })} />
            </label>
          </div>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setError(""); setCategory({ translations: emptyTranslations() }); }}>Создать категорию</button>
          <div className="flex flex-wrap gap-6 text-sm text-muted">
            <label className="flex items-center gap-2"><input type="checkbox" checked={product.isPublished} disabled={saving} onChange={(event) => patchProduct({ isPublished: event.target.checked })} /> Опубликовано</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={product.isFeatured} disabled={saving} onChange={(event) => patchProduct({ isFeatured: event.target.checked })} /> Избранное</label>
          </div>
          <fieldset className="space-y-4" disabled={saving}>
            <PhotoField slot={0} image={product.mainImage} label="Главное фото" onChange={(mainImage) => patchProduct({ mainImage })} onBusy={onUpload} />
            <p className="eyebrow">Галерея ({product.gallery.length}/{MAX_BLIND_GALLERY_IMAGES})</p>
            {product.gallery.map(({ key, image }, index) => (
              <div key={key} className="space-y-2">
                <PhotoField slot={key} image={image} label={`Фото галереи ${index + 1}`} onBusy={onUpload} onChange={(updated) => setProduct((current) => current && ({
                  ...current, gallery: current.gallery.map((item) => item.key === key ? { ...item, image: updated } : item),
                }))} />
                <button type="button" className="btn btn-ghost text-xs" disabled={uploading.has(key)} onClick={() => patchProduct({ gallery: product.gallery.filter((item) => item.key !== key) })}>Убрать фото из галереи</button>
              </div>
            ))}
            {product.gallery.length < MAX_BLIND_GALLERY_IMAGES && <button type="button" className="btn btn-ghost" onClick={() => patchProduct({ gallery: [...product.gallery, { key: nextPhoto.current++, image: "" }] })}>Добавить фото в галерею</button>}
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn btn-solid" disabled={busy}>{saving ? "Сохранение…" : "Сохранить товар"}</button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setError(""); setProduct(null); }}>Отмена</button>
          </div>
        </form>
      )}
      {catalog && !product && !category && (
        <div className="space-y-10">
          <section aria-label="Товары">
            {catalog.products.length === 0 ? <p className="text-sm text-muted">В каталоге пока нет товаров.</p> : (
              <ul className="divide-y divide-line border-y border-line">
                {catalog.products.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-2 py-4">
                    <div className="min-w-0 break-words">
                      <p className="font-display text-xl text-ink">{titleFor(row)}</p>
                      <p className="text-xs text-muted">{row.isPublished ? "Опубликовано" : "Черновик"} · Порядок: {row.sortOrder}{row.isFeatured ? " · Избранное" : ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => openProduct(row)}>Изменить</button>
                      <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => remove(row)}>Удалить</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="blind-categories-title" className="space-y-4 border-t border-line pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="blind-categories-title" className="font-display text-2xl">Категории жалюзи</h2>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setError(""); setCategory({ translations: emptyTranslations() }); }}>Создать категорию</button>
            </div>
            {catalog.categories.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <span className="min-w-0 break-words">{titleFor(row)}</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setError(""); setCategory({ id: row.id, translations: translationsFromApi(row.translations) }); }}>Изменить</button>
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => remove(row, true)}>Удалить</button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </>
  );
}
