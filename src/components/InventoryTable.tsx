"use client";
import { Fragment } from "react";
import { useDocument } from "@/hooks/useDocument";
import { useInventoryStore } from "@/store/useInventoryStore";
import { CategoryGroupRow } from "./CategoryGroupRow";
import { ItemRow } from "./ItemRow";
import type { DocSectionDTO, DocItemDTO } from "@/types";

// PURE FRONTEND: The main editable grid for one inventory document. Renders
// the category/sub-category tree as collapsible group headers
// (CategoryGroupRow), with one row per chemical (ItemRow) underneath.
// Columns: Chemical name, Brand, Catalog No., Quarterly Stocking Quantity,
// then a Current Inventory / For Purchase pair for each quarter currently
// toggled visible in useInventoryStore. Reads document data via
// useDocument and filters rows client-side using the search term and
// pinned-item list from useInventoryStore.

interface InventoryTableProps {
  documentId: string;
}

function matchesSearch(item: DocItemDTO, term: string): boolean {
  if (!term.trim()) return true;
  const haystack = `${item.name} ${item.brand ?? ""} ${item.catalogNo ?? ""}`.toLowerCase();
  return haystack.includes(term.trim().toLowerCase());
}

// Recursively filters a section's items/children, dropping sections that
// end up with nothing left to show (so an empty category header never
// appears just because none of its chemicals matched the search).
function filterSection(
  section: DocSectionDTO,
  searchTerm: string,
  pinnedItemIds: string[]
): DocSectionDTO | null {
  const items = section.items.filter(
    (item) =>
      matchesSearch(item, searchTerm) &&
      (pinnedItemIds.length === 0 || pinnedItemIds.includes(item.id))
  );
  const children = section.children
    .map((child) => filterSection(child, searchTerm, pinnedItemIds))
    .filter((child): child is DocSectionDTO => child !== null);

  if (items.length === 0 && children.length === 0) return null;
  return { ...section, items, children };
}

function renderSection(
  section: DocSectionDTO,
  documentId: string,
  visibleQuarters: number[]
): React.ReactNode {
  return (
    <CategoryGroupRow key={section.id} label={section.label} level={section.level}>
      {section.items.map((item) => (
        <ItemRow
          key={item.id}
          documentId={documentId}
          item={item}
          visibleQuarters={visibleQuarters}
        />
      ))}
      {section.children.map((child) => renderSection(child, documentId, visibleQuarters))}
    </CategoryGroupRow>
  );
}

export function InventoryTable({ documentId }: InventoryTableProps) {
  const { data: document, isLoading, isError } = useDocument(documentId);
  const visibleQuarters = useInventoryStore((s) => s.visibleQuarters);
  const searchTerm = useInventoryStore((s) => s.searchTerm);
  const pinnedItemIds = useInventoryStore((s) => s.pinnedItemIds);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading inventory...</p>;
  }
  if (isError || !document) {
    return <p className="text-sm text-red-600">Could not load this inventory.</p>;
  }

  const filteredSections = document.sections
    .map((section) => filterSection(section, searchTerm, pinnedItemIds))
    .filter((section): section is DocSectionDTO => section !== null);

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-300 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-2 py-2">Chemical</th>
            <th className="px-2 py-2">Brand</th>
            <th className="px-2 py-2">Catalog No.</th>
            <th className="px-2 py-2">Quarterly Stocking Qty</th>
            {visibleQuarters.map((q) => (
              <Fragment key={q}>
                <th className="px-2 py-2">Q{q} Current</th>
                <th className="px-2 py-2">Q{q} For Purchase</th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredSections.length === 0 && (
            <tr>
              <td colSpan={999} className="px-2 py-8 text-center text-sm text-slate-400">
                No chemicals match the current filters.
              </td>
            </tr>
          )}
          {filteredSections.map((section) => renderSection(section, documentId, visibleQuarters))}
        </tbody>
      </table>
    </div>
  );
}
