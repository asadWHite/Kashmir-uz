import { blindAdminResponse, catalogId, deleteBlindEntry, readCatalogBody, saveBlindCategory } from "@/lib/admin-blinds";

type Context = { params: Promise<{ id: string }> };
export const runtime = "nodejs";

export function PUT(request: Request, { params }: Context) {
  return blindAdminResponse(async () => saveBlindCategory(await readCatalogBody(request), catalogId(Number((await params).id))));
}

export function DELETE(_request: Request, { params }: Context) {
  return blindAdminResponse(async () => {
    await deleteBlindEntry(catalogId(Number((await params).id)), true);
    return {};
  });
}
