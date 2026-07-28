// Shared TypeScript types used by both server code (API routes, services)
// and client code (components, hooks, the Zustand store). Kept free of any
// Node-only or browser-only imports so it's safe to import from anywhere in
// the project.
//
// This file is fully specified - types are declarations, not algorithms,
// so (like the Prisma schema) there is nothing here left as a "TODO".

export type DocumentStatus = "draft" | "final";

export interface ParsedQuantity {
  // Represents a "Quarterly Stocking Quantity" string like "3 x 500g"
  // broken into its parts.
  multiplier: number; // e.g. 3 - how many packaging units make up the target
  unitSize: number | null; // e.g. 500 - the size of each unit, if present
  unitLabel: string | null; // e.g. "g", "L", "pcs", "box"
}

// The two ways computeForPurchaseSuggestion can express a shortfall/excess,
// user-selectable via a toggle in the toolbar (see useInventoryStore):
//   - "packageMultiple": as a (possibly fractional) count of the catalog's
//     own package size, e.g. target "3 x 500g" with a 250g shortfall reads
//     "0.5 x 500g" - directly comparable to the Quarterly Stocking Qty
//     column, and tells you how many of the actual purchasable unit to buy.
//   - "plainAmount": as a single leftover amount in the target's base unit,
//     e.g. "1 x 250g" - the raw difference, independent of package size.
export type PurchaseSuggestionFormat = "packageMultiple" | "plainAmount";

export interface QuarterEntryDTO {
  quarter: 1 | 2 | 3 | 4;
  currentInventory: string | null;
  forPurchase: string | null;
  updatedAt: string | null;
}

export interface DocItemDTO {
  id: string;
  name: string;
  brand: string | null;
  catalogNo: string | null;
  quantityRaw: string;
  footnote: boolean;
  // Always length 4, ordered quarter 1 -> 4, even if some quarters have no
  // saved values yet.
  quarters: QuarterEntryDTO[];
}

export interface DocSectionDTO {
  id: string;
  label: string;
  level: number;
  children: DocSectionDTO[];
  items: DocItemDTO[];
}

export interface InventoryDocumentSummaryDTO {
  id: string;
  year: number;
  status: DocumentStatus;
  updatedAt: string;
}

export interface InventoryDocumentFullDTO extends InventoryDocumentSummaryDTO {
  formNo: string;
  section: string;
  issueNo: string;
  issueDate: string;
  authorizedBy: string | null;
  // Top-level sections, one per lab, each with a nested tree of
  // sub-sections and items below it.
  sections: DocSectionDTO[];
}

export interface UpdateQuarterEntryInput {
  docItemId: string;
  quarter: 1 | 2 | 3 | 4;
  currentInventory?: string | null;
  forPurchase?: string | null;
}

export interface CreateDocumentInput {
  year: number;
}

// --- Master catalog management (add/edit chemicals) ---

export interface CreateCatalogItemInput {
  sectionId: string;
  name: string;
  brand?: string | null;
  catalogNo?: string | null;
  quantityRaw: string;
  footnote?: boolean;
}

export interface UpdateCatalogItemInput {
  name?: string;
  brand?: string | null;
  catalogNo?: string | null;
  quantityRaw?: string;
  footnote?: boolean;
}
