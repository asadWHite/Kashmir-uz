import { pool } from "@/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSession())) return Response.json({ ok: false }, { status: 401 });
  const { rows } = await pool.query(`
    SELECT count(*)::int AS curtains,
           count(*) FILTER (WHERE is_featured)::int AS featured,
           (SELECT count(*)::int FROM interiors) AS interiors,
           (SELECT count(*)::int FROM contact_messages WHERE status = 'new') AS messages,
           (SELECT coalesce(json_agg(m ORDER BY m."createdAt" DESC, m.id DESC), '[]')
              FROM (SELECT id, name, left(message, 300) AS message, created_at AS "createdAt"
                      FROM contact_messages ORDER BY created_at DESC, id DESC LIMIT 4) m) AS recent
      FROM curtains
  `);
  const { recent, ...counts } = rows[0];
  return Response.json({ ok: true, counts, recent });
}
