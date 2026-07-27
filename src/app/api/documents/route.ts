// Pure wiring: parses the request, calls the stubbed service functions,
// returns a response. Nothing to implement here - once
// src/lib/services/documents.ts is filled in, these routes work as-is.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated } from "@/lib/pin-session";
import { listDocuments, createDocument, DuplicateYearError } from "@/lib/services/documents";

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

  try {
    const document = await createDocument(body.year);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateYearError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    // Logged so the real cause shows up in Render's logs - without this,
    // an unexpected failure here (e.g. a slow database connection) turns
    // into a bare 500 with no way to tell what actually went wrong.
    console.error("Failed to create inventory document:", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the inventory. Please try again." },
      { status: 500 }
    );
  }
}
