// Pure wiring - see documents/route.ts for the pattern.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated } from "@/lib/pin-session";
import { createCatalogItem } from "@/lib/services/catalog";

const createItemSchema = z.object({
  sectionId: z.string(),
  name: z.string().min(1),
  brand: z.string().nullable().optional(),
  catalogNo: z.string().nullable().optional(),
  quantityRaw: z.string().min(1),
  footnote: z.boolean().optional(),
});

// POST /api/catalog/items
// Input: JSON body matching CreateCatalogItemInput - which section the new
// chemical belongs to, plus its fields. Output: the newly created
// CatalogItem row. Powers the "+ Add chemical" control in CatalogManager.
// Only touches the master catalog - see createCatalogItem for why that
// never affects an already-created InventoryDocument.
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = createItemSchema.parse(await request.json());
  const item = await createCatalogItem(body);
  return NextResponse.json(item, { status: 201 });
}
