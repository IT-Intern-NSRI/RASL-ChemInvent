import {
  Document,
  Packer,
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
  ShadingType,
  PageOrientation,
} from "docx";
import { getDocumentById } from "./documents";
import type { DocSectionDTO, DocItemDTO, InventoryDocumentFullDTO } from "@/types";

// def generateInventoryDocx(documentId): Input is a document id. Output is
// a Buffer containing a .docx file laid out like the original RASL Form 19
// Appendix 4.5.1a: a header block, a table with a repeating header row,
// every category/sub-category heading row, every chemical row, and the
// eight data cells (Current Inventory / For Purchase x 4 quarters) per
// chemical, filled with this document's saved numbers.
//
// Built programmatically with the `docx` library rather than filling a
// hand-authored Word template - this keeps the export fully generated from
// code (no separate binary template file to keep in sync) while still
// reproducing the original's column layout, merged header cells, and
// repeating table header.
export async function generateInventoryDocx(documentId: string): Promise<Buffer> {
  const document = await getDocumentById(documentId);
  const doc = buildDocxDocument(document);
  return Packer.toBuffer(doc);
}

// Exported separately from generateInventoryDocx so it can be unit tested
// with a hand-built InventoryDocumentFullDTO, without touching the database.
export function buildDocxDocument(document: InventoryDocumentFullDTO): Document {
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [...buildHeaderRows(), ...flattenSectionRows(document.sections)],
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
            size: { orientation: PageOrientation.LANDSCAPE },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "U.P. NSRI - RASL", bold: true, size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Quarterly Inventory of Priority Chemicals",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${document.formNo}   |   Section: ${document.section}   |   Issue No: ${document.issueNo}   |   Issue Date: ${document.issueDate}`,
                size: 18,
                italics: true,
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [new TextRun({ text: `YEAR: ${document.year}`, bold: true, size: 24 })],
          }),
          new Paragraph({ text: "" }),
          table,
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Authorized by: ${document.authorizedBy ?? "_________________________"}`,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "* for purposes of research and method development",
                italics: true,
                size: 16,
              }),
            ],
          }),
        ],
      },
    ],
  });
}

function headerCell(text: string, columnSpan = 1, rowSpan = 1): TableCell {
  return new TableCell({
    columnSpan,
    rowSpan,
    verticalAlign: VerticalAlign.CENTER,
    shading: { type: ShadingType.SOLID, color: "auto", fill: "E7E6E6" },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 18 })],
      }),
    ],
  });
}

function textCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: text ?? "", size: 18 })] })],
  });
}

// The table header repeats on every printed page in Word when every row in
// it has `tableHeader: true` - the same effect as the original form's
// repeating "PARTICULARS / QUARTER" header row.
function buildHeaderRows(): TableRow[] {
  const titleRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("Chemicals/Solvents/Supplies for Purchase", 1, 2),
      headerCell("Brand", 1, 2),
      headerCell("Catalog No.", 1, 2),
      headerCell("Quarterly Stocking Quantity", 1, 2),
      headerCell("Quarter 1", 2),
      headerCell("Quarter 2", 2),
      headerCell("Quarter 3", 2),
      headerCell("Quarter 4", 2),
    ],
  });

  const subHeaderRow = new TableRow({
    tableHeader: true,
    children: ([1, 2, 3, 4] as const).flatMap(() => [
      headerCell("Current Inventory"),
      headerCell("For Purchase"),
    ]),
  });

  return [titleRow, subHeaderRow];
}

function buildSectionRow(label: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 12,
        shading: { type: ShadingType.SOLID, color: "auto", fill: "F2F2F2" },
        children: [
          new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] }),
        ],
      }),
    ],
  });
}

function buildItemRow(item: DocItemDTO): TableRow {
  const name = item.footnote ? `${item.name}*` : item.name;
  const cells: TableCell[] = [
    textCell(name),
    textCell(item.brand ?? ""),
    textCell(item.catalogNo ?? ""),
    textCell(item.quantityRaw),
  ];

  // Always render exactly 4 quarters in order, regardless of how many
  // QuarterEntry rows exist - getDocumentById guarantees quarters 1..4 are
  // always present in `item.quarters`, so this never needs a fallback.
  for (const quarter of item.quarters) {
    cells.push(textCell(quarter.currentInventory != null ? String(quarter.currentInventory) : ""));
    cells.push(textCell(quarter.forPurchase != null ? String(quarter.forPurchase) : ""));
  }

  return new TableRow({ children: cells });
}

function flattenSectionRows(sections: DocSectionDTO[]): TableRow[] {
  const rows: TableRow[] = [];

  function walk(section: DocSectionDTO) {
    rows.push(buildSectionRow(section.label));
    for (const item of section.items) {
      rows.push(buildItemRow(item));
    }
    for (const child of section.children) {
      walk(child);
    }
  }

  for (const section of sections) {
    walk(section);
  }

  return rows;
}
