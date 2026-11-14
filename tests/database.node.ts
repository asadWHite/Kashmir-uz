import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import * as schema from "../src/db/schema";
import { verifyCatalog, verifyHistory } from "../src/db/recovery/verify";
import { initializeAdmin } from "../src/db/recovery/admin";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { signToken, verifyToken, getSecret } from "../src/lib/session";
import { SignJWT } from "jose";
import { applyMigration } from "../src/db/recovery/apply";
import { MIGRATION_LOCK } from "../src/db/recovery/manifest";

const target = process.env.TEST_DATABASE_URL;
function cli(file: string) {
  return execFileSync(process.execPath, ["--import", "tsx", file], { env: { ...process.env, DATABASE_URL: target }, encoding: "utf8", stdio: "pipe" });
}
test("baseline is exactly generated from authoritative Drizzle (no data inserts)", async () => {
  const generated = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema));
  const normalize = (s: string) => s.replace(/--> statement-breakpoint/g, "").replace(/\s/g, "");
  const baseline = readFileSync("migrations/0000_production_baseline.sql", "utf8");
  assert.equal(normalize(generated.join("")), normalize(baseline));
  assert.doesNotMatch(baseline, /\b(INSERT|DROP|TRUNCATE)\b/i);
});
test("password and JWT compatibility", async () => {
  process.env.AUTH_SECRET = "test-only-random-secret-of-at-least-32-characters";
  const hash = hashPassword("Test-password-long-419!");
  assert.ok(verifyPassword("Test-password-long-419!", hash));
  assert.ok(!verifyPassword("wrong", hash));
  assert.ok(!verifyPassword("wrong", "malformed"));
  const token = await signToken({ sub: "1", email: "admin@example.test", role: "admin" });
  assert.equal((await verifyToken(token))?.sub, "1");
  assert.equal(await verifyToken(undefined), null);
  assert.equal(await verifyToken(token + "tampered"), null);
  const expired = await new SignJWT({ email: "admin@example.test", role: "admin" }).setSubject("1").setProtectedHeader({alg:"HS256"}).setExpirationTime(1).sign(getSecret());
  assert.equal(await verifyToken(expired), null);
});

test("isolated native PostgreSQL recovery", { skip: !target }, async t => {
  // Fail closed: explicit test name AND loopback only. Never run against Neon.
  const url = new URL(target!);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.match(url.pathname, /_test$/);
  const pool = new Pool({connectionString: target, max: 3});
  const c = await pool.connect();
  try {
    assert.equal((await c.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'")).rows[0].n, 0, "Use a NEW empty disposable database; suite never resets one");
    await t.test("empty health/catalog fails", async () => {
      assert.equal((await verifyCatalog(c)).valid, false);
      assert.equal(await verifyHistory(c), false);
    });
    await t.test("empty initialization and repeated execution", async () => {
      assert.match(cli("scripts/db-migrate.ts"), /PASS 0000_production_baseline/);
      assert.match(cli("scripts/db-migrate.ts"), /history current/);
      assert.equal((await c.query("SELECT count(*)::int AS n FROM public.kashmir_migrations")).rows[0].n, 1);
      assert.equal((await verifyCatalog(c)).valid, true);
      assert.equal(await verifyHistory(c), true);
      assert.match(cli("scripts/db-verify.ts"), /PASS catalog/);
    });
    await t.test("partial SQL failure rolls back DDL and tracking", async () => {
      await assert.rejects(applyMigration(c, {id:"9999_test_failure",checksum:"test",sql:"CREATE TABLE public.test_failure_probe(id integer); SELECT nonexistent_test_function();"}, async()=>{}));
      assert.equal((await c.query("SELECT to_regclass('public.test_failure_probe') AS t")).rows[0].t, null);
      assert.equal((await c.query("SELECT count(*)::int AS n FROM public.kashmir_migrations")).rows[0].n, 1);
    });
    await t.test("concurrent runner is rejected by advisory lock", async () => {
      await c.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK]);
      try {
        const result = await new Promise<number|null>(resolve => {
          const p=spawn(process.execPath,["--import","tsx","scripts/db-migrate.ts"],{env:{...process.env,DATABASE_URL:target},stdio:"ignore"});p.on("exit",resolve);
        });
        assert.equal(result, 1);
      } finally { await c.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK]); }
    });
    await t.test("admin init duplicate never overwrites; login lookup and session storage", async () => {
      await c.query("BEGIN");
      try {
        const password = "Integration-only-password-947!";
        const email = "admin@example.test";
        assert.equal(await initializeAdmin(c,email,password), "created");
        assert.equal(await initializeAdmin(c,email,"Another-strong-password-731!"), "skipped");
        const user = (await c.query("SELECT * FROM admin_users WHERE email=$1", [email])).rows[0];
        assert.ok(verifyPassword(password,user.password_hash));
        assert.ok(!verifyPassword("wrong",user.password_hash));
        assert.equal((await c.query("SELECT id FROM admin_users WHERE email=$1", ["unknown@example.test"])).rowCount, 0);
        await c.query("INSERT INTO admin_sessions(id,admin_user_id,admin_email,expires_at) VALUES($1,$2,$3,now()+interval '7 days')", [crypto.randomUUID(),user.id,email]);
        assert.equal((await c.query("SELECT count(*)::int AS n FROM admin_sessions")).rows[0].n,1);
        await assert.rejects(initializeAdmin(c,email,"short"));
      } finally { await c.query("ROLLBACK"); }
    });
    await t.test("empty application tables and transactional CRUD/FKs/checks", async () => {
      for (const table of Object.values(schema)) {
        const { getTableName } = await import("drizzle-orm");
        const name = getTableName(table);
        assert.equal((await c.query(`SELECT count(*)::int AS n FROM public."${name}"`)).rows[0].n,0);
      }
      await c.query("BEGIN");
      try {
        const category=(await c.query("INSERT INTO categories(name,slug) VALUES('Integration','integration') RETURNING id")).rows[0];
        const curtain=(await c.query("INSERT INTO curtains(name,slug,category_id) VALUES('Integration','integration',$1) RETURNING id",[category.id])).rows[0];
        await c.query("UPDATE curtains SET likes=likes+1 WHERE id=$1",[curtain.id]);
        assert.equal((await c.query("SELECT likes FROM curtains WHERE id=$1",[curtain.id])).rows[0].likes,1);
        await c.query("DELETE FROM categories WHERE id=$1",[category.id]);
        assert.equal((await c.query("SELECT category_id FROM curtains WHERE id=$1",[curtain.id])).rows[0].category_id,null);
        await c.query("SAVEPOINT invalid_locale");
        await assert.rejects(c.query("INSERT INTO content_translations(entity,entity_id,locale) VALUES('curtain',1,'xx')"));
        await c.query("ROLLBACK TO SAVEPOINT invalid_locale");
      } finally { await c.query("ROLLBACK"); }
    });
    await t.test("read-only verifier detects changed default and migration checksum", async () => {
      await c.query("BEGIN");
      try {
        await c.query("ALTER TABLE categories ALTER COLUMN sort_order SET DEFAULT 99");
        assert.equal((await verifyCatalog(c)).valid,false);
        await c.query("UPDATE kashmir_migrations SET checksum='invalid'");
        assert.equal(await verifyHistory(c),false);
      } finally { await c.query("ROLLBACK"); }
      await c.query("BEGIN READ ONLY");
      assert.equal((await verifyCatalog(c)).valid,true);
      assert.equal(await verifyHistory(c),true);
      await c.query("ROLLBACK");
    });
  } finally { c.release(); await pool.end(); }
});
