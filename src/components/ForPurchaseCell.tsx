"use client";
import { useState } from "react";
import { computeForPurchaseSuggestion } from "@/lib/quantity";
import { useUpdateEntry } from "@/hooks/useUpdateEntry";

// PURE FRONTEND: One "For Purchase" cell. Shows the saved/accepted value if
// one has been entered; otherwise shows a computed suggestion as faint
// placeholder text plus a small "Apply" button - per the "suggest, not
// write" requirement, the suggested number is never saved automatically,
// only when the user clicks Apply or types their own value.

interface ForPurchaseCellProps {
  documentId: string;
  docItemId: string;
  quarter: 1 | 2 | 3 | 4;
  value: number | null;
  quantityRaw: string;
  currentInventory: number | null;
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
  const [draft, setDraft] = useState(value != null ? String(value) : "");

  function getSuggestion(): number | null {
    if (currentInventory == null) return null;
    return computeForPurchaseSuggestion(quantityRaw, currentInventory);
  }

  function handleApplySuggestion() {
    const suggestion = getSuggestion();
    if (suggestion == null) return;
    setDraft(String(suggestion));
    updateEntry.mutate({ docItemId, quarter, forPurchase: suggestion });
  }

  function handleManualBlur() {
    const newValue = draft.trim() === "" ? null : Number(draft);
    if (newValue !== null && Number.isNaN(newValue)) return;
    if (newValue === value) return;
    updateEntry.mutate({ docItemId, quarter, forPurchase: newValue });
  }

  const suggestion = value == null ? getSuggestion() : null;

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        value={draft}
        placeholder={suggestion != null ? String(suggestion) : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleManualBlur}
        className="w-20 rounded border border-slate-200 px-2 py-1 text-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
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
      {value == null && suggestion == null && currentInventory != null && (
        <span className="text-xs text-slate-400" title="This quantity can't be auto-computed">
          manual
        </span>
      )}
    </div>
  );
}
