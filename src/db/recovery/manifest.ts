// Deliberate allowlist. Historical 0001/0002 are subsumed; 0003 contains optional
// content and MUST NOT be executed by schema recovery. Append future DDL here.
export const migrations = [{ id: "0000_production_baseline", checksum: "7a7a8679a16133cf57779d976124041d8f34eabe5b39af3639b40012e8dacf06" }];
export const MIGRATION_LOCK = 741903261;
