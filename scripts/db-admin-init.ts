import { RecoveryError } from "../src/db/recovery/errors";
import { recoveryPool, failure } from "./recovery-common";
import { initializeAdmin } from "../src/db/recovery/admin";
import { verifyCatalog, verifyHistory } from "../src/db/recovery/verify";
async function main() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new RecoveryError("ADMIN_EMAIL and ADMIN_PASSWORD required");
  const pool = recoveryPool(); const c = await pool.connect();
  try {
    if (!(await verifyCatalog(c)).valid || !await verifyHistory(c)) throw new RecoveryError("Run migrate and verify first");
    console.log(`PASS administrator ${await initializeAdmin(c, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD)}; existing passwords never changed`);
  } finally { c.release(); await pool.end(); }
}
main().catch(failure);
