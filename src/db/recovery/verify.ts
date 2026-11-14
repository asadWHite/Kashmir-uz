import model from "./model-reference.json";
import { modelContract } from "./model";
import type { PoolClient } from "pg";
import expected from "./catalog-reference.json";
import { readCatalog } from "./catalog";
import { migrations } from "./manifest";
export async function verifyCatalog(c: PoolClient) {
  const actual = await readCatalog(c);
  const failures: string[] = [];
  const warnings: string[] = [];
  if (JSON.stringify(modelContract()) !== JSON.stringify(model)) failures.push("Drizzle model/reference drift: review schema migration and regenerate references on isolated PostgreSQL");
  for (const group of ["columns", "constraints", "indexes", "sequences"] as const) {
    for (const row of expected[group]) {
      const key = (r: Record<string, unknown>) => `${r.table}.${r.name}`;
      const found = actual[group].find(r => key(r) === key(row));
      if (!found || JSON.stringify(found) !== JSON.stringify(row)) failures.push(`${group}: ${key(row)}`);
    }
    for (const row of actual[group]) {
      if (!expected[group].some(r => r.table === row.table && r.name === row.name)) warnings.push(`Extra ${group}: ${row.table}.${row.name}; preserve and review`);
    }
  }
  return { valid: failures.length === 0, failures, warnings };
}
export async function verifyHistory(c: PoolClient) {
  const exists = (await c.query("SELECT to_regclass('public.kashmir_migrations') IS NOT NULL AS ok")).rows[0].ok;
  if (!exists) return false;
  const shape = (await c.query(`SELECT a.attname AS name, format_type(a.atttypid,a.atttypmod) AS type,
    a.attnotnull AS required, pg_get_expr(d.adbin,d.adrelid) AS def
    FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid='public.kashmir_migrations'::regclass AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attname`)).rows;
  if (JSON.stringify(shape) !== JSON.stringify([
    {name:"applied_at",type:"timestamp with time zone",required:true,def:"now()"},
    {name:"checksum",type:"text",required:true,def:null},
    {name:"id",type:"text",required:true,def:null},
  ])) return false;
  const pk = (await c.query("SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid='public.kashmir_migrations'::regclass AND contype='p'")).rows;
  if (pk.length !== 1 || pk[0].def !== "PRIMARY KEY (id)") return false;
  const rows = (await c.query("SELECT id, checksum FROM public.kashmir_migrations ORDER BY id")).rows;
  return rows.length === migrations.length && rows.every((r, i) => r.id === migrations[i].id && r.checksum === migrations[i].checksum);
}
