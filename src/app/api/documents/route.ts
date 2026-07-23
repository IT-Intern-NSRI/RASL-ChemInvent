// Pure wiring: parses the request, calls the stubbed service functions,
// returns a response. Nothing to implement here - once
// src/lib/services/documents.ts is filled in, these routes work as-is.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { listDocuments, createDocument } from "@/lib/services/documents";

// GET /api/documents
// Input: none (auth cookie only). Output: JSON array of
// InventoryDocumentSummaryDTO - powers the "Continue Existing Inventory" list.
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const documents = await listDocuments();
  return NextResponse.json(documents);
}

const createDocumentSchema = z.object({
  year: z.number().int().min(2000).max(2100),
});

// POST /api/documents
// Input: JSON body { year: number }. Output: the newly created
// InventoryDocument (JSON), already snapshotted from the master catalog -
// powers the "Start New Inventory" flow.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = createDocumentSchema.parse(await request.json());
  const document = await createDocument(body.year, session.user.id);
  return NextResponse.json(document, { status: 201 });
}
