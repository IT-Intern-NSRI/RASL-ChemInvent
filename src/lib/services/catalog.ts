import { prisma } from "@/lib/prisma";
import type {
  DocSectionDTO,
  DocItemDTO,
  QuarterEntryDTO,
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
} from "@/types";

// def getMasterCatalogTree(): Input is nothing. Output is the full nested
// tree of every Lab -> CatalogSection -> (sub-sections) -> CatalogItem, in
// the same DocSectionDTO shape a document uses (a fresh document is just a
// snapshot of this tree, all quarters blank). Used by the "Start New
// Inventory" flow to preview what will be copied in, and by a future
// "manage chemicals" admin screen.
//
// Same flat-fetch-then-assemble approach as getDocumentById, adapted to
// the master catalog's tables (Lab/CatalogSection/CatalogItem instead of
// DocSection/DocItem/QuarterEntry) - and with an extra synthetic top level
// per Lab, matching how snapshotCatalogIntoDocument represents each lab as
// its own top-level DocSection.
export async function getMasterCatalogTree(): Promise<DocSectionDTO[]> {
  const labs = await prisma.lab.findMany({ orderBy: { sortOrder: "asc" } });

  const sections = await prisma.catalogSection.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const items = await prisma.catalogItem.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // Empty quarters (1-4, all null) - the master catalog has no saved
  // numbers of its own; those only exist once a document snapshots it.
  const blankQuarters: QuarterEntryDTO[] = ([1, 2, 3, 4] as const).map((quarter) => ({
    quarter,
    currentInventory: null,
    forPurchase: null,
    updatedAt: null,
  }));

  const sectionNodesById = new Map<string, DocSectionDTO>();
  for (const section of sections) {
    sectionNodesById.set(section.id, {
      id: section.id,
      label: section.label,
      level: section.level,
      children: [],
      items: [],
    });
  }

  // Wire CatalogSection children under their parent, and top-level
  // (parentId === null) sections under their lab's synthetic root node.
  const labNodesById = new Map<string, DocSectionDTO>();
  for (const lab of labs) {
    labNodesById.set(lab.id, {
      id: lab.id,
      label: lab.name,
      level: 0,
      children: [],
      items: [],
    });
  }

  for (const section of sections) {
    const node = sectionNodesById.get(section.id)!;
    if (section.parentId) {
      sectionNodesById.get(section.parentId)?.children.push(node);
    } else {
      labNodesById.get(section.labId)?.children.push(node);
    }
  }

  for (const item of items) {
    const node = sectionNodesById.get(item.sectionId);
    if (!node) continue;

    const itemDto: DocItemDTO = {
      id: item.id,
      name: item.name,
      brand: item.brand,
      catalogNo: item.catalogNo,
      quantityRaw: item.quantityRaw,
      footnote: item.footnote,
      quarters: blankQuarters,
    };
    node.items.push(itemDto);
  }

  return labs.map((lab) => labNodesById.get(lab.id)!);
}

// def createCatalogItem(input): Input is which CatalogSection the new
// chemical belongs to (input.sectionId - must be an actual
// CatalogSection id, not a Lab's synthetic root node id from the tree
// above) plus its name/brand/catalogNo/quantityRaw/footnote. Output is
// the newly created CatalogItem row, appended after every existing item
// in that section (sortOrder = current max + 1). This only changes the
// master catalog - it has no effect on any InventoryDocument that
// already exists, since those hold their own deep-copied DocItem rows
// (see README.md "Data model"). It only shows up the next time someone
// starts a new year's inventory (createDocument -> snapshotCatalogIntoDocument).
export async function createCatalogItem(input: CreateCatalogItemInput) {
  const maxSortOrder = await prisma.catalogItem.aggregate({
    where: { sectionId: input.sectionId },
    _max: { sortOrder: true },
  });

  return prisma.catalogItem.create({
    data: {
      sectionId: input.sectionId,
      name: input.name,
      brand: input.brand ?? null,
      catalogNo: input.catalogNo ?? null,
      quantityRaw: input.quantityRaw,
      footnote: input.footnote ?? false,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  });
}

// def updateCatalogItem(itemId, input): Input is an existing CatalogItem's
// id and any subset of its editable fields (name, brand, catalogNo,
// quantityRaw, footnote - each omitted field is left untouched, matching
// the same "partial update" convention as updateQuarterEntry in
// entries.ts). Output is the updated CatalogItem row. Same
// snapshot-isolation note as createCatalogItem above applies: editing a
// chemical here never rewrites a past year's saved document.
export async function updateCatalogItem(itemId: string, input: UpdateCatalogItemInput) {
  return prisma.catalogItem.update({
    where: { id: itemId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.brand !== undefined && { brand: input.brand }),
      ...(input.catalogNo !== undefined && { catalogNo: input.catalogNo }),
      ...(input.quantityRaw !== undefined && { quantityRaw: input.quantityRaw }),
      ...(input.footnote !== undefined && { footnote: input.footnote }),
    },
  });
}

// def deleteCatalogItem(itemId): Input is an existing CatalogItem's id.
// Output is the deleted CatalogItem row. Only removes it from the master
// catalog - any InventoryDocument that already snapshotted this chemical
// keeps its own DocItem row untouched (schema.prisma sets
// DocItem.catalogItemId to SET NULL on delete specifically so a past
// year's saved document survives its source catalog row disappearing -
// see "Data model" in README.md). The only visible effect elsewhere is
// that DocItem.catalogItem traceability link goes null for any document
// that referenced this row; the document's own name/brand/catalogNo/
// quantityRaw/footnote/quarter numbers are copies, not references, so
// they're unaffected either way.
export async function deleteCatalogItem(itemId: string) {
  return prisma.catalogItem.delete({
    where: { id: itemId },
  });
}

