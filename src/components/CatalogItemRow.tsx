"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { DocItemDTO } from "@/types";
import { useUpdateCatalogItem, useDeleteCatalogItem } from "@/hooks/useCatalog";

// PURE FRONTEND: One editable chemical row in the master-catalog
// management screen - name, brand, catalog number, quarterly stocking
// quantity (free text), a footnote checkbox, and a delete control, each
// saved/applied independently. Text fields mirror CurrentInventoryCell's
// "local draft state, save on blur, skip the request if unchanged"
// pattern. Delete mirrors DocumentList's "click the trash icon to swap
// into an inline confirm, no native confirm() popup" pattern - clicking
// it removes this chemical from the master catalog only; any already-
// saved InventoryDocument keeps its own copy (see deleteCatalogItem).

interface CatalogItemRowProps {
  item: DocItemDTO;
}

export function CatalogItemRow({ item }: CatalogItemRowProps) {
  const updateItem = useUpdateCatalogItem();
  const deleteItem = useDeleteCatalogItem();

  const [name, setName] = useState(item.name);
  const [brand, setBrand] = useState(item.brand ?? "");
  const [catalogNo, setCatalogNo] = useState(item.catalogNo ?? "");
  const [quantityRaw, setQuantityRaw] = useState(item.quantityRaw);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleNameBlur() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === item.name) return;
    updateItem.mutate({ itemId: item.id, name: trimmed });
  }

  function handleBrandBlur() {
    const trimmed = brand.trim();
    const newValue = trimmed === "" ? null : trimmed;
    if (newValue === (item.brand ?? null)) return;
    updateItem.mutate({ itemId: item.id, brand: newValue });
  }

  function handleCatalogNoBlur() {
    const trimmed = catalogNo.trim();
    const newValue = trimmed === "" ? null : trimmed;
    if (newValue === (item.catalogNo ?? null)) return;
    updateItem.mutate({ itemId: item.id, catalogNo: newValue });
  }

  function handleQuantityBlur() {
    const trimmed = quantityRaw.trim();
    if (!trimmed || trimmed === item.quantityRaw) return;
    updateItem.mutate({ itemId: item.id, quantityRaw: trimmed });
  }

  function handleFootnoteChange(checked: boolean) {
    updateItem.mutate({ itemId: item.id, footnote: checked });
  }

  function handleConfirmDelete() {
    deleteItem.mutate(item.id, {
      onSettled: () => setConfirmingDelete(false),
    });
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-2 py-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          className="w-48 rounded border border-slate-200 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          onBlur={handleBrandBlur}
          className="w-32 rounded border border-slate-200 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          value={catalogNo}
          onChange={(e) => setCatalogNo(e.target.value)}
          onBlur={handleCatalogNoBlur}
          className="w-28 rounded border border-slate-200 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          value={quantityRaw}
          onChange={(e) => setQuantityRaw(e.target.value)}
          onBlur={handleQuantityBlur}
          className="w-36 rounded border border-slate-200 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
        />
      </td>
      <td className="px-2 py-1.5 text-center">
        <input
          type="checkbox"
          checked={item.footnote}
          onChange={(e) => handleFootnoteChange(e.target.checked)}
          title="Footnote item (for purposes of research and method development)"
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        {confirmingDelete ? (
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
            <span className="text-xs text-red-600">Delete?</span>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteItem.isPending}
              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteItem.isPending ? "Deleting..." : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-xs text-slate-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            title={`Delete ${item.name} from the master catalog`}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        )}
      </td>
    </tr>
  );
}
