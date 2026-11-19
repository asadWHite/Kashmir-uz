import { blindAdminResponse, readCatalogBody, saveBlindCategory } from "@/lib/admin-blinds";

export const runtime = "nodejs";

export function POST(request: Request) {
  return blindAdminResponse(async () => saveBlindCategory(await readCatalogBody(request)));
}
