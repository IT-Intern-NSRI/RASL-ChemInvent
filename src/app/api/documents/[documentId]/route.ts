// Pure wiring - see documents/route.ts for the pattern.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDocumentById, updateDocumentStatus } from "@/lib/services/documents";

// GET /api/documents/:documentId
// Input: documentId from the URL. Output: InventoryDocumentFullDTO - the
// full tree the editable grid renders.
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const document = await getDocumentById(params.documentId);
  return NextResponse.json(document);
}

const patchSchema = z.object({ status: z.enum(["draft", "final"]) });

// PATCH /api/documents/:documentId
// Input: documentId from the URL + JSON body { status }. Output: the
// updated document row - used by a "Mark as Final" action.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = patchSchema.parse(await request.json());
  const document = await updateDocumentStatus(params.documentId, body.status);
  return NextResponse.json(document);
}
