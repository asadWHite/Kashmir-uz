import { readFileSync } from "node:fs";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import { RecoveryError } from "../src/db/recovery/errors";
import * as schema from "../src/db/schema";

/** Reviewed Drizzle-owned DDL. The SQL-only analytics migration remains independent. */
export async function reviewedModelMigrations() {
  const { blindCategories, blindImages, blinds, ...baseline } = schema;
  const normalize = (text: string) => text.replace(/--> statement-breakpoint/g, "").replace(/\s/g, "");
  const initial = generateDrizzleJson({});
  const base = generateDrizzleJson(baseline);
  const full = generateDrizzleJson({ blindCategories, blindImages, blinds, ...baseline });
  return Promise.all([
    { id: "0000_production_baseline", from: initial, to: base },
    { id: "0005_blinds_catalog", from: base, to: full },
  ].map(async ({ id, from, to }) => {
    const sql = readFileSync(`migrations/${id}.sql`, "utf8");
    const generated = await generateMigration(from, to);
    if (normalize(sql) !== normalize(generated.join(""))) throw new RecoveryError(`${id}/Drizzle drift; review DDL first`);
    return { id, sql };
  }));
}
