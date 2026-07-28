"use client";
import { useUpdateEntry } from "@/hooks/useUpdateEntry";
import { QuantityExpressionInput } from "./QuantityExpressionInput";

// PURE FRONTEND: One editable cell for a chemical's "Current Inventory" in
// one quarter - free text in the "<count> x <amount><unit>[, ...]" grammar
// (e.g. "1 x 1kg, 1 x 250g" for a stock split across containers), saved on
// blur. See QuantityExpressionInput for the input itself, including its
// structured-builder popover.

interface CurrentInventoryCellProps {
  documentId: string;
  docItemId: string;
  quarter: 1 | 2 | 3 | 4;
  value: string | null;
}

export function CurrentInventoryCell({
  documentId,
  docItemId,
  quarter,
  value,
}: CurrentInventoryCellProps) {
  const updateEntry = useUpdateEntry(documentId);

  function handleSave(newValue: string | null) {
    updateEntry.mutate({ docItemId, quarter, currentInventory: newValue });
  }

  return (
    <QuantityExpressionInput
      value={value ?? ""}
      title="e.g. 1 x 1kg, 1 x 250g"
      onSave={handleSave}
    />
  );
}
