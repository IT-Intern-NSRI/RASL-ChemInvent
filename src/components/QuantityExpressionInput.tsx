"use client";
import { useEffect, useId, useState } from "react";
import { parseQuantityExpression } from "@/lib/quantity";

// PURE FRONTEND: One editable "<count> x <amount><unit>[, ...]" cell -
// used by both CurrentInventoryCell (typing your own stock split, e.g.
// "1 x 1kg, 1 x 250g") and ForPurchaseCell (showing/overriding the
// suggested purchase amount, e.g. "0.5 x 500g"). A single text field
// handles the common case (type the shorthand directly, matching how the
// Quarterly Stocking Qty column itself reads); a small "+" button opens a
// structured builder - one [count] x [amount] [unit] row per container,
// with "add another" - for people who'd rather not type the grammar by
// hand. Saving never requires the text to fully parse (matches how
// quantityRaw itself is edited elsewhere) - parsing only gates whether the
// "For Purchase" suggestion can be computed from it, not whether a value
// can be saved.

interface QuantityExpressionInputProps {
  value: string; // the currently saved text, or "" if empty
  placeholder?: string; // shown faded when the field is empty (the suggestion)
  title?: string;
  onSave: (newValue: string | null) => void;
}

interface BuilderRow {
  count: string;
  amount: string;
  unit: string;
}

const UNIT_SUGGESTIONS = ["g", "kg", "mg", "mL", "L", "pcs", "box", "pack"];

const EMPTY_ROW: BuilderRow = { count: "", amount: "", unit: "" };

export function QuantityExpressionInput({
  value,
  placeholder,
  title,
  onSave,
}: QuantityExpressionInputProps) {
  const [draft, setDraft] = useState(value);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [rows, setRows] = useState<BuilderRow[]>([EMPTY_ROW]);
  const unitListId = useId();

  // Keep the field in sync with the server value (e.g. after clicking
  // "Apply" on a suggestion, or a save from elsewhere finishing) - safe to
  // key on `value` alone since it only changes when *this* cell's own
  // saved value changes, never as a side effect of editing a different
  // cell.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleBlur() {
    const trimmed = draft.trim();
    const newValue = trimmed === "" ? null : trimmed;
    if (trimmed === value.trim()) return;
    onSave(newValue);
  }

  function openBuilder() {
    const parsed = parseQuantityExpression(draft);
    setRows(
      parsed && parsed.length > 0
        ? parsed.map((component) => ({
            count: String(component.multiplier),
            amount: component.unitSize != null ? String(component.unitSize) : "",
            unit: component.unitLabel ?? "",
          }))
        : [EMPTY_ROW]
    );
    setBuilderOpen(true);
  }

  function updateRow(index: number, field: keyof BuilderRow, fieldValue: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: fieldValue } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, EMPTY_ROW]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function applyBuilder() {
    const parts = rows
      .filter((row) => row.count.trim() && row.amount.trim() && row.unit.trim())
      .map((row) => `${row.count.trim()} x ${row.amount.trim()}${row.unit.trim()}`);

    setBuilderOpen(false);
    if (parts.length === 0) return;

    const joined = parts.join(", ");
    setDraft(joined);
    onSave(joined);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          title={title}
          className="w-40 rounded border border-slate-200 px-2 py-1 text-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={openBuilder}
          title="Build from multiple containers"
          className="rounded border border-slate-200 px-1.5 py-1 text-xs leading-none text-slate-500 hover:bg-slate-100"
        >
          +
        </button>
      </div>

      {builderOpen && (
        <div className="absolute z-10 mt-1 w-72 rounded-md border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs text-slate-500">Add one row per container, e.g. 1 &times; 1 kg.</p>

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex items-center gap-1">
                <input
                  value={row.count}
                  onChange={(e) => updateRow(index, "count", e.target.value)}
                  placeholder="Qty"
                  className="w-12 rounded border border-slate-300 px-1.5 py-1 text-xs"
                />
                <span className="text-xs text-slate-400">x</span>
                <input
                  value={row.amount}
                  onChange={(e) => updateRow(index, "amount", e.target.value)}
                  placeholder="Amount"
                  className="w-16 rounded border border-slate-300 px-1.5 py-1 text-xs"
                />
                <input
                  value={row.unit}
                  onChange={(e) => updateRow(index, "unit", e.target.value)}
                  placeholder="Unit"
                  list={unitListId}
                  className="w-16 rounded border border-slate-300 px-1.5 py-1 text-xs"
                />
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    title="Remove this row"
                    className="text-xs text-slate-400 hover:text-red-600"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>

          <datalist id={unitListId}>
            {UNIT_SUGGESTIONS.map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={addRow}
              className="text-xs font-medium text-slate-500 hover:underline"
            >
              + Add another
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBuilderOpen(false)}
                className="text-xs text-slate-500 hover:underline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyBuilder}
                className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
              >
                Use this
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
