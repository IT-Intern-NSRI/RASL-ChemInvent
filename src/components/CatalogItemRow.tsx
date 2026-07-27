"use client";
import { useState } from "react";
import type { DocItemDTO } from "@/types";
import { useUpdateCatalogItem } from "@/hooks/useCatalog";

// PURE FRONTEND: One editable chemical row in the master-catalog
// management screen - name, brand, catalog number, quarterly stocking
// quantity (free text), and a footnote checkbox, each saved independently
// on blur/change via useUpdateCatalogItem. Mirrors CurrentInventoryCell's
// "local draft state, save on blur, skip the request if unchanged"
// pattern, just for text fields instead of numbers.

interface CatalogItemRowProps {
  item: DocItemDTO;
}

export function CatalogItemRow({ item }: CatalogItemRowProps) {
  const updateItem = useUpdateCatalogItem();

  const [name, setName] = useState(item.name);
  const [brand, setBrand] = useState(item.brand ?? "");
  const [catalogNo, setCatalogNo] = useState(item.catalogNo ?? "");
  const [quantityRaw, setQuantityRaw] = useState(item.quantityRaw);

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
    </tr>
  );
}
