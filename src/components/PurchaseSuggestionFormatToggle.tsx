"use client";
import { useInventoryStore } from "@/store/useInventoryStore";

// PURE FRONTEND: A small toggle bound to useInventoryStore's
// purchaseSuggestionFormat, switching how the (not-yet-applied) "For
// Purchase" suggestion is expressed:
//   - "Package multiples" - a fractional count of the catalog's own
//     package size, e.g. "0.5 x 500g".
//   - "Plain amount" - the raw leftover amount, e.g. "1 x 250g".
// Purely a display/suggestion preference - it never changes anything
// already saved, only how the next un-applied suggestion is formatted.

export function PurchaseSuggestionFormatToggle() {
  const format = useInventoryStore((s) => s.purchaseSuggestionFormat);
  const toggleFormat = useInventoryStore((s) => s.togglePurchaseSuggestionFormat);

  return (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      <span className="font-medium">Purchase suggestion:</span>
      <button
        type="button"
        onClick={toggleFormat}
        title="Switch how the suggested purchase amount is expressed"
        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        {format === "packageMultiple" ? "Package multiples (e.g. 0.5 x 500g)" : "Plain amount (e.g. 1 x 250g)"}
      </button>
    </div>
  );
}
