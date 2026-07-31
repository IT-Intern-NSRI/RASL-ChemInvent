// Pure wiring - see documents/route.ts for the pattern.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated } from "@/lib/pin-session";
import { updateCatalogItem, deleteCatalogItem } from "@/lib/services/catalog";

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().nullable().optional(),
  catalogNo: z.string().nullable().optional(),
  quantityRaw: z.string().min(1).optional(),
  footnote: z.boolean().optional(),
});

// PATCH /api/catalog/items/:itemId
// Input: itemId from the URL + a JSON body with any subset of
// UpdateCatalogItemInput's fields. Output: the updated CatalogItem row.
// Called on field blur from CatalogItemRow. Only touches the master
// catalog - see updateCatalogItem for why that never rewrites a past
// year's saved document.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { itemId } = await params;
  const body = updateItemSchema.parse(await request.json());
  const item = await updateCatalogItem(itemId, body);
  return NextResponse.json(item);
}

// DELETE /api/catalog/items/:itemId
// Input: itemId from the URL. Output: 204 with no body on success.
// Permanently removes this chemical from the master catalog - called from
// the delete control on CatalogItemRow, after the user confirms. Does not
// touch any InventoryDocument that already snapshotted this chemical (see
// deleteCatalogItem for why that's safe).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { itemId } = await params;
  await deleteCatalogItem(itemId);
  return new NextResponse(null, { status: 204 });
}
