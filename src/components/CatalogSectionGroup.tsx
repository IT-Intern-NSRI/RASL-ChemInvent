"use client";
import { useState } from "react";
import type { DocSectionDTO } from "@/types";
import { CategoryGroupRow } from "./CategoryGroupRow";
import { CatalogItemRow } from "./CatalogItemRow";
import { AddCatalogItemForm } from "./AddCatalogItemForm";

// PURE FRONTEND: One collapsible category (or sub-category) inside
// CatalogManager - same CategoryGroupRow shell InventoryTable uses, but
// rows are editable CatalogItemRows instead of read-only ItemRows, plus an
// "+ Add chemical" control (or, while open, an AddCatalogItemForm) that
// creates a new CatalogItem directly in *this* section. Recurses into any
// nested sub-sections the same way InventoryTable's renderSection does.
//
// `section.id` here is always a real CatalogSection id (never a Lab's
// synthetic root node) because CatalogManager only ever renders this
// component for a lab's `children`, not for the lab node itself - a
// chemical's sectionId has to reference an actual CatalogSection row.

interface CatalogSectionGroupProps {
  section: DocSectionDTO;
}

export function CatalogSectionGroup({ section }: CatalogSectionGroupProps) {
  const [addingNew, setAddingNew] = useState(false);

  return (
    <CategoryGroupRow label={section.label} level={section.level}>
      {section.items.map((item) => (
        <CatalogItemRow key={item.id} item={item} />
      ))}

      <tr>
        <td colSpan={999} className="px-2 py-1.5" style={{ paddingLeft: `${(section.level + 1) * 16}px` }}>
          {addingNew ? (
            <AddCatalogItemForm sectionId={section.id} onDone={() => setAddingNew(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
            >
              + Add chemical
            </button>
          )}
        </td>
      </tr>

      {section.children.map((child) => (
        <CatalogSectionGroup key={child.id} section={child} />
      ))}
    </CategoryGroupRow>
  );
}
