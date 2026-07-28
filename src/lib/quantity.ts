// The one genuinely tricky piece of business logic in this project: turning
// the form's free-text "Quarterly Stocking Quantity" column (e.g.
// "3 x 500g", "1 x 1L", "2 packs", "Stock not required") into a target, and
// comparing it against a "Current Inventory" value written in that same
// grammar (but allowing several comma-separated components, e.g.
// "1 x 1kg, 1 x 250g" for stock split across containers) to suggest a
// "For Purchase" amount - also written back out in that same grammar.
import type { ParsedQuantity, PurchaseSuggestionFormat } from "@/types";

// def parseQuantity(raw): Input is a single "<count> x <amount><unit>"
// segment as printed on the form (real examples from the source document:
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

// def parseQuantityExpression(raw): Input is a "Current Inventory" cell's
// free text - one or more parseQuantity segments separated by commas, e.g.
// "1 x 1kg, 1 x 250g" for a stock split across two containers. Output is
// the parsed segments, or null if the text is blank or any segment doesn't
// parse. All-or-nothing on purpose: a partially-typed or malformed
// expression shouldn't silently drop a piece and understate what's on
// the shelf - it's better to fall back to "can't auto-suggest yet" (see
// computeForPurchaseSuggestion) than to guess.
export function parseQuantityExpression(raw: string): ParsedQuantity[] | null {
  const text = raw.trim();
  if (!text) return null;

  const segments = text
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) return null;

  const parsed: ParsedQuantity[] = [];
  for (const segment of segments) {
    const component = parseQuantity(segment);
    if (!component) return null;
    parsed.push(component);
  }
  return parsed;
}

// --- Unit conversion, so components in different (but compatible) units
// can be summed - e.g. "1 x 1kg, 1 x 250g" totals 1250g. Units outside
// these two families (pcs, box, pack, ...) are treated as their own
// atomic, non-convertible "count" family, matched by the unit text itself
// (case/trailing-period-insensitive) - a target counted in "pcs" is only
// ever compared against other "pcs" components, never converted to
// anything else.
const MASS_TO_GRAMS: Record<string, number> = { mg: 0.001, g: 1, kg: 1000 };
const VOLUME_TO_ML: Record<string, number> = { ml: 1, l: 1000 };

function normalizeUnitLabel(label: string | null): string {
  return (label ?? "").trim().toLowerCase().replace(/\.$/, "");
}

// The factor that converts one of this unit into its family's canonical
// base unit (grams for mass, mL for volume; 1 for anything else, since
// count-style units like "pcs"/"box" are already their own base unit).
function unitConversionFactor(unitLabel: string | null): number {
  const unit = normalizeUnitLabel(unitLabel);
  if (unit in MASS_TO_GRAMS) return MASS_TO_GRAMS[unit];
  if (unit in VOLUME_TO_ML) return VOLUME_TO_ML[unit];
  return 1;
}

interface CanonicalAmount {
  family: string; // "mass" | "volume" | `count:${normalized unit label}`
  amount: number; // grams for mass, mL for volume, raw count otherwise
}

function canonicalize(component: ParsedQuantity): CanonicalAmount {
  const unit = normalizeUnitLabel(component.unitLabel);
  const size = component.unitSize ?? 1;
  const family = unit in MASS_TO_GRAMS ? "mass" : unit in VOLUME_TO_ML ? "volume" : `count:${unit}`;
  return { family, amount: component.multiplier * size * unitConversionFactor(component.unitLabel) };
}

// Rounds to 2 decimal places and strips trailing zeros, e.g. 0.50 -> "0.5",
// 1.00 -> "1".
function formatNumber(n: number): string {
  return Number(n.toFixed(2)).toString();
}

function formatSuggestion(
  diffAmount: number,
  target: ParsedQuantity,
  format: PurchaseSuggestionFormat
): string {
  const unitLabel = target.unitLabel ?? "";

  if (target.unitSize == null) {
    // No numeric package size to divide by (e.g. "2 packs", "1 box") -
    // diffAmount is already a plain count of that same unit, so there's
    // only one sensible way to write it regardless of `format`.
    return `${formatNumber(diffAmount)} x ${unitLabel}`;
  }

  // diffAmount arrives in canonical units (grams/mL) - convert back into
  // the target's own stated unit (e.g. L, not mL) before using it, since
  // the target's unitSize/unitLabel are in that original unit too.
  const factor = unitConversionFactor(target.unitLabel);
  const diffInTargetUnit = diffAmount / factor;

  if (format === "plainAmount") {
    // The raw leftover amount in the target's own stated unit, e.g.
    // target "1 x 1L" with a 500mL shortfall -> "1 x 0.5L".
    return `1 x ${formatNumber(diffInTargetUnit)}${unitLabel}`;
  }

  // "packageMultiple" (default): a (possibly fractional) count of the
  // catalog's own package size, e.g. target "3 x 500g" with a 250g
  // shortfall -> "0.5 x 500g" - directly comparable to the Quarterly
  // Stocking Qty column, and tells you how many of the actual purchasable
  // unit to buy.
  const packagesNeeded = diffInTargetUnit / target.unitSize;
  return `${formatNumber(packagesNeeded)} x ${target.unitSize}${unitLabel}`;
}

// def computeForPurchaseSuggestion(quantityRaw, currentText, format): Input
// is the raw "Quarterly Stocking Quantity" string for one chemical, the
// text just typed into "Current Inventory" for one quarter (one or more
// "<count> x <amount><unit>" components), and which of the two output
// conventions to use (see PurchaseSuggestionFormat - defaults to
// "packageMultiple"). Output is the suggested "For Purchase" text, in that
// same grammar - or null when there's nothing to compute from (the
// quantity string couldn't be parsed, e.g. "Stock not required"; Current
// is blank; or Current doesn't parse), in which case the UI shows a
// "manual entry required" hint instead of guessing. The suggestion is the
// absolute difference between target and current (over-target counts as a
// deviation needing attention too, not just under-target), matching the
// behaviour this was already tested against before the format changed.
export function computeForPurchaseSuggestion(
  quantityRaw: string,
  currentText: string | null,
  format: PurchaseSuggestionFormat = "packageMultiple"
): string | null {
  const target = parseQuantity(quantityRaw);
  if (!target) return null;

  if (currentText == null || currentText.trim() === "") return null;
  const currentComponents = parseQuantityExpression(currentText);
  if (!currentComponents) return null;

  const targetCanonical = canonicalize(target);
  const currentTotal = currentComponents
    .map(canonicalize)
    .filter((c) => c.family === targetCanonical.family)
    .reduce((sum, c) => sum + c.amount, 0);

  const diffAmount = Math.abs(targetCanonical.amount - currentTotal);
  return formatSuggestion(diffAmount, target, format);
}
