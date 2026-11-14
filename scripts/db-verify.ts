import { recoveryPool, failure } from "./recovery-common";
import { verifyCatalog, verifyHistory } from "../src/db/recovery/verify";
async function main() {
  const pool = recoveryPool();
  const c = await pool.connect();
  try {
    await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const result = await verifyCatalog(c);
    const history = await verifyHistory(c);
    for (const f of result.failures) console.log(`FAIL ${f}`);
    for (const w of result.warnings) console.log(`WARNING ${w}`);
    console.log(`${history ? "PASS" : "FAIL"} migration history`);
    console.log(`${result.valid ? "PASS" : "FAIL"} catalog: columns/types/defaults/PK/FK/unique/checks/indexes/owned sequences`);
    console.log("NOT VERIFIED Neon project/branch identity, production login and deployment");
    if (!history || !result.valid) process.exitCode = 1;
    await c.query("ROLLBACK");
  } finally { c.release(); await pool.end(); }
}
main().catch(failure);
