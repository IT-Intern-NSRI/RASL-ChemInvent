import { prisma } from "@/lib/prisma";
import { snapshotCatalogIntoDocument } from "./catalog-snapshot";
import type {
  InventoryDocumentSummaryDTO,
  InventoryDocumentFullDTO,
  DocumentStatus,
  DocSectionDTO,
  DocItemDTO,
  QuarterEntryDTO,
} from "@/types";

// def listDocuments(): Input is nothing. Output is every saved inventory as
// InventoryDocumentSummaryDTO (id, year, status, updatedAt), newest-first.
// Powers the "Continue Existing Inventory" list on the startup screen.
export async function listDocuments(): Promise<InventoryDocumentSummaryDTO[]> {
  const documents = await prisma.inventoryDocument.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return documents.map((doc) => ({
    id: doc.id,
    year: doc.year,
    status: doc.status as DocumentStatus,
    updatedAt: doc.updatedAt.toISOString(),
  }));
}

// def getDocumentById(documentId): Input is a document id. Output is the
// InventoryDocumentFullDTO: header metadata plus the entire
// section/item/quarter-entry tree, ready for the editable grid.
//
// Implementation note: fetches sections and items as two flat queries
// (rather than one deeply-nested `include`, which would need a hardcoded
// max depth for DocSection's self-relation) and assembles the tree in
// memory - a handful of queries regardless of how deep the category tree
// gets, instead of one query whose shape has to guess the depth up front.
export async function getDocumentById(documentId: string): Promise<InventoryDocumentFullDTO> {
  const document = await prisma.inventoryDocument.findUniqueOrThrow({
    where: { id: documentId },
  });

  const sections = await prisma.docSection.findMany({
    where: { documentId },
    orderBy: { sortOrder: "asc" },
  });

  const items = await prisma.docItem.findMany({
    where: { docSection: { documentId } },
    orderBy: { sortOrder: "asc" },
    include: { quarterEntries: true },
  });

  // Build an empty DocSectionDTO per section, keyed by id.
  const nodesById = new Map<string, DocSectionDTO>();
  for (const section of sections) {
    nodesById.set(section.id, {
      id: section.id,
      label: section.label,
      level: section.level,
      children: [],
      items: [],
    });
  }

  // Wire parent -> children, collecting roots (top-level, one per lab)
  // along the way.
  const roots: DocSectionDTO[] = [];
  for (const section of sections) {
    const node = nodesById.get(section.id)!;
    if (section.parentId) {
      nodesById.get(section.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Attach items to their section, filling in any quarters (1-4) that
  // don't have a QuarterEntry row yet with null values.
  for (const item of items) {
    const node = nodesById.get(item.docSectionId);
    if (!node) continue;

    const quartersByNumber = new Map(item.quarterEntries.map((q) => [q.quarter, q]));
    const quarters: QuarterEntryDTO[] = ([1, 2, 3, 4] as const).map((quarter) => {
      const entry = quartersByNumber.get(quarter);
      return {
        quarter,
        currentInventory: entry?.currentInventory ?? null,
        forPurchase: entry?.forPurchase ?? null,
        updatedAt: entry?.updatedAt ? entry.updatedAt.toISOString() : null,
      };
    });

    const itemDto: DocItemDTO = {
      id: item.id,
      name: item.name,
      brand: item.brand,
      catalogNo: item.catalogNo,
      quantityRaw: item.quantityRaw,
      footnote: item.footnote,
      quarters,
    };

    node.items.push(itemDto);
  }

  return {
    id: document.id,
    year: document.year,
    status: document.status as DocumentStatus,
    updatedAt: document.updatedAt.toISOString(),
    formNo: document.formNo,
    section: document.section,
    issueNo: document.issueNo,
    issueDate: document.issueDate,
    authorizedBy: document.authorizedBy,
    sections: roots,
  };
}

// def createDocument(year): Input is the calendar year for the new
// inventory (e.g. 2027). Output is the newly created InventoryDocument
// row. Side effect: snapshots the current master catalog into
// DocSection/DocItem/QuarterEntry rows for the new document, so later
// catalog edits never retroactively change a past year's saved numbers.
export async function createDocument(year: number) {
  const existing = await prisma.inventoryDocument.findUnique({ where: { year } });
  if (existing) {
    throw new Error(`An inventory for ${year} already exists.`);
  }

  const document = await prisma.inventoryDocument.create({
    data: { year, status: "draft" },
  });

  await snapshotCatalogIntoDocument(document.id);

  return document;
}

// def updateDocumentStatus(documentId, status): Input is a document id and
// the new status ("draft" or "final" - "final" represents the quarter's
// numbers being signed off and not expected to change further). Output is
// the updated InventoryDocument row.
export async function updateDocumentStatus(documentId: string, status: DocumentStatus) {
  return prisma.inventoryDocument.update({
    where: { id: documentId },
    data: { status },
  });
}

// def deleteDocument(documentId): Input is a document id. Output is the
// deleted InventoryDocument row. Side effect: permanently removes that
// document's entire DocSection/DocItem/QuarterEntry tree along with it -
// each of those models cascades on its parent (see the `onDelete: Cascade`
// relations in schema.prisma), so a single delete here is enough; nothing
// is left orphaned. This only ever removes one year's saved snapshot - it
// has no effect on the master catalog (Lab/CatalogSection/CatalogItem) or
// on any other document.
export async function deleteDocument(documentId: string) {
  return prisma.inventoryDocument.delete({
    where: { id: documentId },
  });
}
