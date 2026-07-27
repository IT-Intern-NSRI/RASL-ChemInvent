// Pure wiring - see documents/route.ts for the pattern.
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/pin-session";
import { getMasterCatalogTree } from "@/lib/services/catalog";

// GET /api/catalog
// Input: none. Output: the full master catalog tree (JSON) - used by the
// "Start New Inventory" screen to preview what will be snapshotted.
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tree = await getMasterCatalogTree();
  return NextResponse.json(tree);
}
