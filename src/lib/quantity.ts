// The one genuinely tricky piece of business logic in this project: turning
// the form's free-text "Quarterly Stocking Quantity" column (e.g.
// "3 x 500g", "1 x 1L", "2 packs", "Stock not required") into a number the
// "For Purchase" suggestion can be computed from.
import type { ParsedQuantity } from "@/types";

// def parseQuantity(raw): Input is the exact "Quarterly Stocking Quantity"
// text as printed on the form (real examples from the source document:
// "1 x 100g", "3 x 500g", "1 x 2.5L", "2 x 108 pcs.", "2 Boxes each",
// "Stock not required"). Output is a ParsedQuantity when a leading count
// can be extracted, or null when the text has no numeric target to compare
// against (most notably "Stock not required").
export function parseQuantity(raw: string): ParsedQuantity | null {
  const text = raw.trim();
  if (!text) return null;
  if (/not required/i.test(text)) return null;

  // "<count> x <size><unit>", the vast majority of rows -
  // e.g. "3 x 500g", "1 x 100 mL", "2 x 108 pcs.", "1 x 2.5L"
  const sizedMatch = text.match(/^(\d+)\s*x\s*([\d.]+)\s*([a-zA-Z]+)\.?\s*$/i);
  if (sizedMatch) {
    return {
      multiplier: parseInt(sizedMatch[1], 10),
      unitSize: parseFloat(sizedMatch[2]),
      unitLabel: sizedMatch[3],
    };
  }

  // Looser "<count> x <anything>" fallback for phrasing that doesn't
  // cleanly split into a numeric size + unit token.
  const looseXMatch = text.match(/^(\d+)\s*x\s*(.+)$/i);
  if (looseXMatch) {
    return {
      multiplier: parseInt(looseXMatch[1], 10),
      unitSize: null,
      unitLabel: looseXMatch[2].trim(),
    };
  }

  // "<count> pack(s)/box(es) [each]" - e.g. "2 packs", "1 box", "2 Boxes each"
  const packMatch = text.match(/^(\d+)\s+(packs?|box(?:es)?)\b/i);
  if (packMatch) {
    return {
      multiplier: parseInt(packMatch[1], 10),
      unitSize: null,
      unitLabel: packMatch[2].toLowerCase().startsWith("pack") ? "pack" : "box",
    };
  }

  return null;
}

// def computeForPurchaseSuggestion(quantityRaw, currentInventory): Input is
// the raw "Quarterly Stocking Quantity" string for one chemical, and the
// number just typed into "Current Inventory" for one quarter (how many
// packaging units of that chemical are on the shelf right now). Output is
// the suggested "For Purchase" count - the absolute difference between the
// parsed target multiplier and currentInventory - or null when the
// quantity string couldn't be parsed, in which case the UI shows a
// "manual entry required" hint instead of guessing.
export function computeForPurchaseSuggestion(
  quantityRaw: string,
  currentInventory: number
): number | null {
  const parsed = parseQuantity(quantityRaw);
  if (!parsed) return null;
  return Math.abs(parsed.multiplier - currentInventory);
}
