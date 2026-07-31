"use client";
import { useCatalog } from "@/hooks/useCatalog";
import { CatalogSectionGroup } from "./CatalogSectionGroup";

// PURE FRONTEND: The master-catalog management screen - one table per lab
// (from useCatalog), each row an editable chemical (name / brand / catalog
// no. / quarterly stocking quantity / footnote, saved on blur via
// CatalogItemRow) grouped under collapsible CatalogSectionGroup sections,
// with a "+ Add chemical" control under every section.
//
// Edits here only ever change the *master* catalog - already-created
// InventoryDocuments hold their own deep-copied snapshot and are
// completely unaffected (see README.md "Data model"). A change made here
// shows up the next time someone clicks "Start New Inventory".
export function CatalogManager() {
  const { data: labs, isLoading, isError } = useCatalog();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading master catalog...</p>;
  }
  if (isError || !labs) {
    return <p className="text-sm text-red-600">Could not load the master catalog.</p>;
  }

  return (
    <div className="space-y-6">
      {labs.map((lab) => (
        <div key={lab.id} className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
            {lab.label}
          </div>
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2">Chemical</th>
                <th className="px-2 py-2">Brand</th>
                <th className="px-2 py-2">Catalog No.</th>
                <th className="px-2 py-2">Quarterly Stocking Qty</th>
                <th className="px-2 py-2 text-center">Footnote *</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {lab.children.length === 0 && (
                <tr>
                  <td colSpan={999} className="px-2 py-4 text-center text-sm text-slate-400">
                    No categories yet in this lab.
                  </td>
                </tr>
              )}
              {lab.children.map((section) => (
                <CatalogSectionGroup key={section.id} section={section} />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
