import { prisma } from "@/lib/prisma";
import type { DocSectionDTO, DocItemDTO, QuarterEntryDTO } from "@/types";

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
