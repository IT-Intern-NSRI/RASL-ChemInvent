import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient | PrismaClient;

interface CatalogSectionRow {
  id: string;
  labId: string;
  parentId: string | null;
  label: string;
  sortOrder: number;
}

interface CatalogItemRow {
  id: string;
  sectionId: string;
  sortOrder: number;
  name: string;
  brand: string | null;
  catalogNo: string | null;
  quantityRaw: string;
  footnote: boolean;
}

// def snapshotCatalogIntoDocument(documentId, tx): Input is a freshly
// created, still-empty InventoryDocument's id, and optionally an existing
// Prisma transaction client (pass one in when this needs to be atomic
// with whatever created the document - e.g. createDocument in
// documents.ts - since Prisma doesn't support nesting one `$transaction`
// inside another). Output is nothing directly - its effect is populating
// that document's DocSection/DocItem/QuarterEntry rows by deep-copying the
// current state of every Lab/CatalogSection/CatalogItem. This is what
// makes each saved year an immutable snapshot: later edits to the master
// catalog (adding, renaming, or removing a chemical) never change a
// document that already exists.
//
// Implementation note: this reads the *entire* catalog with three queries
// up front (labs, all sections, all items - regardless of how deep the
// section tree gets) and assembles the DocSection/DocItem/QuarterEntry
// rows in memory, generating their ids itself with randomUUID() so it can
// write each table back with a single createMany call. An earlier version
// walked the tree recursively, issuing one query per section plus one
// create per item (200+ sequential round trips for the current ~90-item
// catalog) inside a single interactive transaction - on Neon's pooled
// connection, especially after a free-tier compute cold start, that was
// slow enough to occasionally exceed the transaction timeout and fail the
// whole "Start New Inventory" request with a 500. Six total queries
// regardless of catalog size removes that failure mode rather than just
// raising the timeout further.
export async function snapshotCatalogIntoDocument(
  documentId: string,
  tx: Tx = prisma
): Promise<void> {
  const [labs, catalogSections, catalogItems] = await Promise.all([
    tx.lab.findMany({ orderBy: { sortOrder: "asc" } }),
    tx.catalogSection.findMany({ orderBy: { sortOrder: "asc" } }),
    tx.catalogItem.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const sectionsByParent = new Map<string | null, CatalogSectionRow[]>();
  for (const section of catalogSections) {
    const key = section.parentId;
    const bucket = sectionsByParent.get(key);
    if (bucket) bucket.push(section);
    else sectionsByParent.set(key, [section]);
  }

  const itemsBySection = new Map<string, CatalogItemRow[]>();
  for (const item of catalogItems) {
    const bucket = itemsBySection.get(item.sectionId);
    if (bucket) bucket.push(item);
    else itemsBySection.set(item.sectionId, [item]);
  }

  const docSectionRows: {
    id: string;
    documentId: string;
    labId: string | null;
    parentId: string | null;
    label: string;
    level: number;
    sortOrder: number;
  }[] = [];

  const docItemRows: {
    id: string;
    docSectionId: string;
    catalogItemId: string;
    sortOrder: number;
    name: string;
    brand: string | null;
    catalogNo: string | null;
    quantityRaw: string;
    footnote: boolean;
  }[] = [];

  const quarterEntryRows: { id: string; docItemId: string; quarter: number }[] = [];

  function walkSection(section: CatalogSectionRow, parentDocSectionId: string, level: number) {
    const docSectionId = randomUUID();
    docSectionRows.push({
      id: docSectionId,
      documentId,
      labId: null,
      parentId: parentDocSectionId,
      label: section.label,
      level,
      sortOrder: section.sortOrder,
    });

    for (const item of itemsBySection.get(section.id) ?? []) {
      const docItemId = randomUUID();
      docItemRows.push({
        id: docItemId,
        docSectionId,
        catalogItemId: item.id,
        sortOrder: item.sortOrder,
        name: item.name,
        brand: item.brand,
        catalogNo: item.catalogNo,
        quantityRaw: item.quantityRaw,
        footnote: item.footnote,
      });
      for (const quarter of [1, 2, 3, 4]) {
        quarterEntryRows.push({ id: randomUUID(), docItemId, quarter });
      }
    }

    for (const child of sectionsByParent.get(section.id) ?? []) {
      walkSection(child, docSectionId, level + 1);
    }
  }

  for (const lab of labs) {
    // One top-level DocSection per lab, so the grid can group everything
    // under "Water Quality Laboratory" / "Pesticide Laboratory" the same
    // way the original form does.
    const labDocSectionId = randomUUID();
    docSectionRows.push({
      id: labDocSectionId,
      documentId,
      labId: lab.id,
      parentId: null,
      label: lab.name,
      level: 0,
      sortOrder: lab.sortOrder,
    });

    const topSections = (sectionsByParent.get(null) ?? []).filter((s) => s.labId === lab.id);
    for (const section of topSections) {
      walkSection(section, labDocSectionId, 1);
    }
  }

  // Order matters: sections before items (items reference docSectionId),
  // items before quarter entries (entries reference docItemId).
  await tx.docSection.createMany({ data: docSectionRows });
  await tx.docItem.createMany({ data: docItemRows });
  await tx.quarterEntry.createMany({ data: quarterEntryRows });
}
