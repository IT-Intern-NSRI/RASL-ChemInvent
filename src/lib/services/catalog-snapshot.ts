import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

// def snapshotCatalogIntoDocument(documentId): Input is a freshly created,
// still-empty InventoryDocument's id. Output is nothing directly - its
// effect is populating that document's DocSection/DocItem/QuarterEntry rows
// by deep-copying the current state of every Lab/CatalogSection/CatalogItem.
// This is what makes each saved year an immutable snapshot: later edits to
// the master catalog (adding, renaming, or removing a chemical) never
// change a document that already exists.
//
// Implementation note: rather than one deeply-nested Prisma `include`
// (which would need a hardcoded max depth for a self-relation), this walks
// the CatalogSection tree recursively with one query per level - simpler
// to read and works at any nesting depth, including the current form's
// flat one.
export async function snapshotCatalogIntoDocument(documentId: string): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const labs = await tx.lab.findMany({ orderBy: { sortOrder: "asc" } });

      for (const lab of labs) {
        // One top-level DocSection per lab, so the grid can group
        // everything under "Water Quality Laboratory" /
        // "Pesticide Laboratory" the same way the original form does.
        const labDocSection = await tx.docSection.create({
          data: {
            documentId,
            labId: lab.id,
            parentId: null,
            label: lab.name,
            level: 0,
            sortOrder: lab.sortOrder,
          },
        });

        const topSections = await tx.catalogSection.findMany({
          where: { labId: lab.id, parentId: null },
          orderBy: { sortOrder: "asc" },
        });

        for (const section of topSections) {
          await copySection(tx, section, documentId, labDocSection.id, 1);
        }
      }
    },
    { timeout: 30000 }
  );
}

async function copySection(
  tx: Tx,
  catalogSection: { id: string; label: string; sortOrder: number },
  documentId: string,
  parentDocSectionId: string,
  level: number
): Promise<void> {
  const docSection = await tx.docSection.create({
    data: {
      documentId,
      labId: null,
      parentId: parentDocSectionId,
      label: catalogSection.label,
      level,
      sortOrder: catalogSection.sortOrder,
    },
  });

  await copyItems(tx, catalogSection.id, docSection.id);

  const children = await tx.catalogSection.findMany({
    where: { parentId: catalogSection.id },
    orderBy: { sortOrder: "asc" },
  });
  for (const child of children) {
    await copySection(tx, child, documentId, docSection.id, level + 1);
  }
}

async function copyItems(tx: Tx, catalogSectionId: string, docSectionId: string): Promise<void> {
  const items = await tx.catalogItem.findMany({
    where: { sectionId: catalogSectionId },
    orderBy: { sortOrder: "asc" },
  });

  for (const item of items) {
    const docItem = await tx.docItem.create({
      data: {
        docSectionId,
        catalogItemId: item.id,
        sortOrder: item.sortOrder,
        name: item.name,
        brand: item.brand,
        catalogNo: item.catalogNo,
        quantityRaw: item.quantityRaw,
        footnote: item.footnote,
      },
    });

    await tx.quarterEntry.createMany({
      data: [1, 2, 3, 4].map((quarter) => ({
        docItemId: docItem.id,
        quarter,
      })),
    });
  }
}
