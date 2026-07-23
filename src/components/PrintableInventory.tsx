"use client";
import { useDocument } from "@/hooks/useDocument";
import type { DocSectionDTO } from "@/types";

// PURE FRONTEND: A read-only, all-quarters-visible, no-editing-controls
// rendering of the entire document in one flat layout close to the
// original paper form - the "view the entire document as a whole /
// print-view" requirement. Styled with print:* Tailwind variants so it
// also serves as the browser's print target (Ctrl/Cmd+P).

interface PrintableInventoryProps {
  documentId: string;
}

function renderSection(section: DocSectionDTO): React.ReactNode {
  return (
    <div key={section.id} className="mb-4 break-inside-avoid">
      <h3
        className="mb-1 text-sm font-semibold text-slate-800"
        style={{ paddingLeft: `${section.level * 16}px` }}
      >
        {section.label}
      </h3>

      {section.items.length > 0 && (
        <table className="mb-2 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-left uppercase text-slate-500">
              <th className="px-2 py-1">Chemical</th>
              <th className="px-2 py-1">Brand</th>
              <th className="px-2 py-1">Catalog No.</th>
              <th className="px-2 py-1">Qty</th>
              {[1, 2, 3, 4].map((q) => (
                <th key={q} className="px-2 py-1" colSpan={2}>
                  Q{q} (Current / For Purchase)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-2 py-1">
                  {item.name}
                  {item.footnote && "*"}
                </td>
                <td className="px-2 py-1">{item.brand ?? "\u2014"}</td>
                <td className="px-2 py-1">{item.catalogNo ?? "\u2014"}</td>
                <td className="px-2 py-1">{item.quantityRaw}</td>
                {item.quarters.map((q) => (
                  <td key={q.quarter} className="px-2 py-1" colSpan={2}>
                    {q.currentInventory ?? "\u2014"} / {q.forPurchase ?? "\u2014"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {section.children.map(renderSection)}
    </div>
  );
}

export function PrintableInventory({ documentId }: PrintableInventoryProps) {
  const { data: document, isLoading, isError } = useDocument(documentId);

  if (isLoading) return <p className="p-6 text-sm text-slate-500">Loading...</p>;
  if (isError || !document) {
    return <p className="p-6 text-sm text-red-600">Could not load this inventory.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 print:max-w-none print:px-4 print:py-2">
      <div className="mb-4 text-center">
        <h1 className="text-lg font-semibold">U.P. NSRI - RASL</h1>
        <p className="text-sm text-slate-600">Quarterly Inventory of Priority Chemicals</p>
        <p className="text-xs text-slate-400">
          {document.formNo} | Section: {document.section} | Issue No: {document.issueNo} | Issue
          Date: {document.issueDate}
        </p>
        <p className="mt-2 font-medium">YEAR: {document.year}</p>
      </div>

      {document.sections.map(renderSection)}

      <p className="mt-4 text-xs text-slate-500">
        * for purposes of research and method development
      </p>

      <div className="mt-8 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Print
        </button>
      </div>
    </div>
  );
}
