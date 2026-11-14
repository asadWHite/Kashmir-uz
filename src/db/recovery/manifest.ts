// Deliberate allowlist. Historical 0001/0002 are subsumed; 0003 contains optional
// content and MUST NOT be executed by schema recovery. Append future DDL here.
// 0004 adds first-party visitor analytics (analytics_visitors / analytics_sessions /
// analytics_events). It is additive only and is applied by `npm run db:migrate`
// before the analytics code is considered live; the application degrades
// gracefully (tracking no-ops, dashboard shows an empty state) until then.
export const migrations = [
  { id: "0000_production_baseline", checksum: "7a7a8679a16133cf57779d976124041d8f34eabe5b39af3639b40012e8dacf06" },
  { id: "0004_visitor_analytics", checksum: "73ef31f50069fe2d23e75fc8b2711548b45ddc4947324b09247d3dc23242d344" },
];
export const MIGRATION_LOCK = 741903261;
