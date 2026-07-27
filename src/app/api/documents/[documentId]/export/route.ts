// Pure wiring - see documents/route.ts for the pattern.
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/pin-session";
import { generateInventoryDocx } from "@/lib/services/export";

// GET /api/documents/:documentId/export
// Input: documentId from the URL. Output: a .docx file download (binary
// response with a Content-Disposition header) - the "Export to Word"
// button's target.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { documentId } = await params;
  const buffer = await generateInventoryDocx(documentId);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="inventory-${documentId}.docx"`,
    },
  });
}
