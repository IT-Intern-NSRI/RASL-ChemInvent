"use client";
import { useState } from "react";
import { useUpdateEntry } from "@/hooks/useUpdateEntry";

// PURE FRONTEND: One editable numeric cell for a chemical's "Current
// Inventory" in one quarter. Shows the saved value, lets the user type a
// new number, and saves on blur.

interface CurrentInventoryCellProps {
  documentId: string;
  docItemId: string;
  quarter: 1 | 2 | 3 | 4;
  value: number | null;
}

export function CurrentInventoryCell({
  documentId,
  docItemId,
  quarter,
  value,
}: CurrentInventoryCellProps) {
  const updateEntry = useUpdateEntry(documentId);
  const [draft, setDraft] = useState(value != null ? String(value) : "");

  function handleBlur() {
    const newValue = draft.trim() === "" ? null : Number(draft);
    if (newValue !== null && Number.isNaN(newValue)) return;
    if (newValue === value) return;
    updateEntry.mutate({ docItemId, quarter, currentInventory: newValue });
  }

  return (
    <input
      type="number"
      min={0}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      className="w-20 rounded border border-slate-200 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
    />
  );
}
