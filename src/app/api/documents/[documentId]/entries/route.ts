// Pure wiring - see documents/route.ts for the pattern.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated } from "@/lib/pin-session";
import { updateQuarterEntry } from "@/lib/services/entries";

const patchSchema = z.object({
  docItemId: z.string(),
  quarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  currentInventory: z.string().nullable().optional(),
  forPurchase: z.string().nullable().optional(),
});

// PATCH /api/documents/:documentId/entries
// Input: documentId from the URL (used for route grouping only - the entry
// itself is looked up by docItemId in the body) + a JSON body matching
// UpdateQuarterEntryInput. Output: the updated QuarterEntry row. Called on
// cell blur from CurrentInventoryCell / ForPurchaseCell.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = patchSchema.parse(await request.json());
  const entry = await updateQuarterEntry(body);
  return NextResponse.json(entry);
}
