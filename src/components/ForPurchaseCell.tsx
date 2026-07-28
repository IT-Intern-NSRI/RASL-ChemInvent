"use client";
import { computeForPurchaseSuggestion } from "@/lib/quantity";
import { useUpdateEntry } from "@/hooks/useUpdateEntry";
import { useInventoryStore } from "@/store/useInventoryStore";
import { QuantityExpressionInput } from "./QuantityExpressionInput";

// PURE FRONTEND: One "For Purchase" cell. Shows the saved/accepted text if
// one has been entered; otherwise shows a computed suggestion (in the same
// "<count> x <amount><unit>" grammar as Current Inventory and the
// Quarterly Stocking Qty column - see computeForPurchaseSuggestion) as
// faint placeholder text plus a small "Apply" button - per the "suggest,
// not write" requirement, the suggestion is never saved automatically,
// only when the user clicks Apply or types their own value. Which of the
// two suggestion conventions to use (fractional package multiples vs. a
// plain leftover amount) comes from useInventoryStore, toggled globally
// via PurchaseSuggestionFormatToggle.

interface ForPurchaseCellProps {
  documentId: string;
  docItemId: string;
  quarter: 1 | 2 | 3 | 4;
  value: string | null;
  quantityRaw: string;
  currentInventory: string | null;
}

export function ForPurchaseCell({
  documentId,
  docItemId,
  quarter,
  value,
  quantityRaw,
  currentInventory,
}: ForPurchaseCellProps) {
  const updateEntry = useUpdateEntry(documentId);
  const suggestionFormat = useInventoryStore((s) => s.purchaseSuggestionFormat);

  const suggestion =
    value == null
      ? computeForPurchaseSuggestion(quantityRaw, currentInventory, suggestionFormat)
      : null;

  function handleSave(newValue: string | null) {
    updateEntry.mutate({ docItemId, quarter, forPurchase: newValue });
  }

  function handleApplySuggestion() {
    if (suggestion == null) return;
    updateEntry.mutate({ docItemId, quarter, forPurchase: suggestion });
  }

  const hasCurrentInventory = currentInventory != null && currentInventory.trim() !== "";

  return (
    <div className="flex items-center gap-1">
      <QuantityExpressionInput
        value={value ?? ""}
        placeholder={suggestion ?? undefined}
        title="e.g. 0.5 x 500g"
        onSave={handleSave}
      />
      {value == null && suggestion != null && (
        <button
          type="button"
          onClick={handleApplySuggestion}
          title={`Apply suggested value: ${suggestion}`}
          className="rounded bg-slate-100 px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
        >
          Apply
        </button>
      )}
      {value == null && suggestion == null && hasCurrentInventory && (
        <span className="text-xs text-slate-400" title="This quantity can't be auto-computed">
          manual
        </span>
      )}
    </div>
  );
}
