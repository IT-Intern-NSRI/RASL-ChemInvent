import Link from "next/link";
import { InventoryTable } from "@/components/InventoryTable";
import { QuarterVisibilityToggle } from "@/components/QuarterVisibilityToggle";
import { ChemicalSearchBox } from "@/components/ChemicalSearchBox";
import { PurchaseSuggestionFormatToggle } from "@/components/PurchaseSuggestionFormatToggle";
import { SaveStatusBadge } from "@/components/SaveStatusBadge";

// PURE FRONTEND (server component): The main editable-inventory page for
// one document/year. Composes the filter controls
// (QuarterVisibilityToggle, ChemicalSearchBox, PurchaseSuggestionFormatToggle),
// a SaveStatusBadge, a link to the print view, a link that hits
// /api/documents/:id/export to download the .docx, and the InventoryTable
// itself.

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            &larr; Back
          </Link>
          <SaveStatusBadge />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/documents/${documentId}/print`}
            className="text-sm text-slate-600 hover:underline"
          >
            Print view
          </Link>
          <a
            href={`/api/documents/${documentId}/export`}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Export to Word
          </a>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <QuarterVisibilityToggle />
        <ChemicalSearchBox />
        <PurchaseSuggestionFormatToggle />
      </div>

      <InventoryTable documentId={documentId} />
    </div>
  );
}
