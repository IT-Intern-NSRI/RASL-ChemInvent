// Pure wiring: parses the request, calls the stubbed service functions,
// returns a response. Nothing to implement here - once
// src/lib/services/documents.ts is filled in, these routes work as-is.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated } from "@/lib/pin-session";
import { listDocuments, createDocument } from "@/lib/services/documents";

// GET /api/documents
// Input: none (session cookie only). Output: JSON array of
// InventoryDocumentSummaryDTO - powers the "Continue Existing Inventory" list.
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
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
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = createDocumentSchema.parse(await request.json());
  const document = await createDocument(body.year);
  return NextResponse.json(document, { status: 201 });
}
