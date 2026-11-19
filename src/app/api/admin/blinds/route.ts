import { blindAdminResponse, listBlindCatalog, readCatalogBody, saveBlind } from "@/lib/admin-blinds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return blindAdminResponse(listBlindCatalog);
}

export function POST(request: Request) {
  return blindAdminResponse(async () => saveBlind(await readCatalogBody(request)));
}
