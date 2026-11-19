import type { NextRequest } from "next/server";
import { serveBlindImage } from "@/lib/blind-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return serveBlindImage(request, (await params).id, true);
}
