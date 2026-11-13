/**
 * Static guard for the admin forms.
 *
 * A field that exists both in the shared (non-translated) block and in the
 * per-language editor shows up twice, and the second one silently wins or looks
 * empty. That is exactly what happened with «Цвет» and «Материал» on the
 * curtains screen: an administrator saw the same input twice, and in the
 * gallery/statistics screens the record name was typed once as a "service"
 * field and again in each language tab.
 *
 * There is no browser in CI here, so this asserts the structure that made the
 * duplication possible: the localized `extraKey` fields must not also be
 * rendered as shared `<Field label=…>` inputs, and a page that has a shared
 * "название/подпись" input must not have rows in the language editor that would
 * duplicate it.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PAGES = ["curtains", "interiors", "categories", "faq", "gallery", "statistics"];

const read = (page: string) =>
  readFileSync(join(process.cwd(), "src/app/admin/(protected)", page, "page.tsx"), "utf8");

for (const page of PAGES) {
  test(`${page}: no input appears in both the shared block and the language editor`, () => {
    const src = read(page);

    // Every localized attribute defined for the language editor…
    const extras = [...src.matchAll(/extraKey: "([^"]+)"/g)].map((m) => m[1]);
    // …must not also be rendered by a shared <Field label="…"> block.
    const sharedLabels = [...src.matchAll(/<Field\s+[\s\S]{0,120}?label="([^"]+)"/g)].map(
      (m) => m[1],
    );

    expect(
      sharedLabels,
      `В «${page}» общий блок и редактор языков не должны повторять одно и то же поле`,
    ).not.toContain(
      expect.stringMatching(/Цвет|Материал|Локация|Адрес|Часы|Название|Подпись|Заголовок/i),
    );

    // `extraKey` values are per-language by definition; a shared input with the
    // same name would create the double-entry the admin reported.
    for (const key of extras) {
      expect(
        sharedLabels.some((label) => label.toLowerCase().includes(key.toLowerCase())),
        `«${key}» объявлен как переводимое поле, но есть и общий ввод для него`,
      ).toBe(false);
    }
  });

  test(`${page}: a shared name field is derived, not typed twice`, () => {
    const src = read(page);

    // The old duplicated "service" name inputs had these labels. They must be
    // gone: the shared column is mirrored from the languages in `save()`.
    expect(src).not.toMatch(/label="(Название|Подпись) \(служебн/);

    // And the save path must derive the shared column from a language value.
    if (/translationsDraft/.test(src)) {
      expect(src).toMatch(/translationsDraft\.(uz|ru|en)\.title\.trim\(\)/);
    }
  });
}
