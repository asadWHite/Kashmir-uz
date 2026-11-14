import type { PoolClient } from "pg";

// Catalog-only reads: no application rows and no schema writes.
export async function readCatalog(c: PoolClient) {
  const columns = (await c.query(`SELECT t.relname AS "table", a.attname AS name,
    format_type(a.atttypid,a.atttypmod) AS type, a.attnotnull AS required,
    pg_get_expr(d.adbin,d.adrelid) AS "default", a.attidentity AS identity,
    CASE WHEN a.atttypid='int4'::regtype THEN pg_get_serial_sequence(format('%I.%I',n.nspname,t.relname),a.attname) END AS sequence
    FROM pg_class t JOIN pg_namespace n ON n.oid=t.relnamespace
    JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped
    LEFT JOIN pg_attrdef d ON d.adrelid=t.oid AND d.adnum=a.attnum
    WHERE n.nspname='public' AND t.relkind='r' AND t.relname <> 'kashmir_migrations'
    ORDER BY t.relname,a.attname`)).rows;
  const constraints = (await c.query(`SELECT t.relname AS "table", c.conname AS name,
    c.contype AS type, pg_get_constraintdef(c.oid) AS definition, c.convalidated AS valid
    FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='public' AND t.relname <> 'kashmir_migrations' AND c.contype IN ('p','f','u','c')
    ORDER BY t.relname,c.conname`)).rows;
  const indexes = (await c.query(`SELECT t.relname AS "table", i.relname AS name,
    pg_get_indexdef(i.oid) AS definition, x.indisvalid AS valid, x.indisready AS ready
    FROM pg_index x JOIN pg_class t ON t.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname <> 'kashmir_migrations'
    ORDER BY t.relname,i.relname`)).rows;
  const sequences = (await c.query(`SELECT t.relname AS "table", a.attname AS column,
    s.relname AS name, d.deptype AS ownership, q.seqtypid::regtype::text AS type,
    q.seqstart::text AS start, q.seqincrement::text AS increment, q.seqmin::text AS min,
    q.seqmax::text AS max, q.seqcache::text AS cache, q.seqcycle AS cycle
    FROM pg_class s JOIN pg_namespace n ON n.oid=s.relnamespace
    JOIN pg_sequence q ON q.seqrelid=s.oid JOIN pg_depend d ON d.objid=s.oid AND d.classid='pg_class'::regclass AND d.deptype IN ('a','i')
    JOIN pg_class t ON t.oid=d.refobjid JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=d.refobjsubid
    WHERE n.nspname='public' ORDER BY t.relname,a.attname`)).rows;
  return { columns, constraints, indexes, sequences };
}
