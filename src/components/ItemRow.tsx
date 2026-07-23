"use client";
import { Fragment } from "react";
import type { DocItemDTO } from "@/types";
import { CurrentInventoryCell } from "./CurrentInventoryCell";
import { ForPurchaseCell } from "./ForPurchaseCell";

// PURE FRONTEND: One chemical's row inside InventoryTable - shows name,
// brand, catalog number, the quarterly stocking quantity text (with a
// footnote marker for asterisk items), and one CurrentInventoryCell +
// ForPurchaseCell pair per currently visible quarter.

interface ItemRowProps {
  documentId: string;
  item: DocItemDTO;
  visibleQuarters: number[];
}

export function ItemRow({ documentId, item, visibleQuarters }: ItemRowProps) {
  const quarters = item.quarters.filter((q) => visibleQuarters.includes(q.quarter));

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-2 py-1.5 text-sm text-slate-900">
        {item.name}
        {item.footnote && <span className="text-slate-400"> *</span>}
      </td>
      <td className="px-2 py-1.5 text-sm text-slate-600">{item.brand ?? "\u2014"}</td>
      <td className="px-2 py-1.5 text-sm text-slate-600">{item.catalogNo ?? "\u2014"}</td>
      <td className="px-2 py-1.5 text-sm text-slate-600">{item.quantityRaw}</td>
      {quarters.map((q) => (
        <Fragment key={q.quarter}>
          <td className="px-2 py-1.5">
            <CurrentInventoryCell
              documentId={documentId}
              docItemId={item.id}
              quarter={q.quarter}
              value={q.currentInventory}
            />
          </td>
          <td className="px-2 py-1.5">
            <ForPurchaseCell
              documentId={documentId}
              docItemId={item.id}
              quarter={q.quarter}
              value={q.forPurchase}
              quantityRaw={item.quantityRaw}
              currentInventory={q.currentInventory}
            />
          </td>
        </Fragment>
      ))}
    </tr>
  );
}
