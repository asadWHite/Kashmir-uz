import { eq } from "drizzle-orm";
import { db } from "@/db";
import { curtains, interiors, gallery } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { notFound, serveStoredImage } from "@/lib/media-route";

export async function GET(_request: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  if (!(await getSession())) return new Response(null, { status: 401 });
  const { kind, id } = await context.params;
  const table = kind === "curtains" ? curtains : kind === "interiors" ? interiors : kind === "gallery" ? gallery : null;
  const recordId = Number(id);
  if (!table || !Number.isSafeInteger(recordId) || recordId < 1) return notFound();
  const [row] = await db.select({ image: table.imageUrl }).from(table).where(eq(table.id, recordId)).limit(1);
  if (!row) return notFound();
  return serveStoredImage({
    stored: row.image, width: "384", quality: null, versioned: false,
    cacheControl: "private, no-store", label: "Admin thumbnail",
  }, { id: recordId, galleryIndex: null });
}
