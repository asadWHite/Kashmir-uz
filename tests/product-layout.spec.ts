/**
 * Regression guard: `next/image` with `fill` requires a positioned parent.
 *
 * Production broke on `/curtains/classic-soft-fold`: the product photo filled
 * the viewport and the title/description were pushed under it. Cause: PR #28
 * replaced `<img className="h-full w-full object-cover">` with
 * `<MediaImage>` (fill mode) inside boxes such as
 * `<div class="aspect-square overflow-hidden">` — without `relative`.
 *
 * next/image renders a fill image as `position:absolute; inset:0`. An absolutely
 * positioned box is laid out against its nearest *positioned* ancestor, and
 * `overflow:hidden` on a `static` ancestor does not clip its descendants. With
 * no positioned ancestor the image is positioned against the page and covers
 * everything after it.
 *
 * No browser is available in this environment, so this test reads the JSX and
 * asserts the invariant directly (the same approach as admin-fields.spec.ts).
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const POSITIONED = /(^|["'\s`])(relative|absolute|fixed|sticky)(["'\s`]|$)/;

/** Every file that renders the shared image primitive. */
const FILES = execSync("grep -rl 'MediaImage' --include=*.tsx src/", { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((f) => !f.endsWith("MediaImage.tsx"));

for (const file of FILES) {
  test(`${file}: every MediaImage fill has a positioned ancestor`, () => {
    const lines = readFileSync(file, "utf8").split("\n");

    lines.forEach((line, index) => {
      if (!/<MediaImage/.test(line)) return;
      // Non-fill images set their own intrinsic size and need no container.
      if (/fill=\{false\}/.test(line)) return;

      // Collect enclosing elements by walking back up the JSX.
      const ancestors: string[] = [];
      for (let i = index; i >= 0 && i > index - 40; i -= 1) {
        const current = lines[i];
        if (
          /className=\{?[`"][^`"]*[`"]\}?/.test(current) &&
          /<(div|span|figure|section|article|li|a)\b/.test(current)
        ) {
          const match = /className=(?:\{`([^`]*)`\}|"([^"]*)"|\{[^}]*"([^"]*)"[^}]*\})/.exec(current);
          ancestors.push(match ? (match[1] ?? match[2] ?? match[3] ?? "") : "");
        }
        if (i < index && /^\s*<\/(div|span|figure|section|article|li|a)>/.test(current)) break;
      }

      expect(
        ancestors.some((className) => POSITIONED.test(` ${className} `)),
        `MediaImage (fill) at ${file}:${index + 1} has no positioned ancestor — ` +
          `add \`relative\` to the wrapping element, otherwise the absolutely ` +
          `positioned image is laid out against the page and covers the content.`,
      ).toBe(true);
    });
  });
}
