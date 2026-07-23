import { PrintableInventory } from "@/components/PrintableInventory";

// PURE FRONTEND (server component): The "view the entire document as a
// whole / print-view" page - renders PrintableInventory full-screen.
export default function DocumentPrintPage({
  params,
}: {
  params: { documentId: string };
}) {
  return <PrintableInventory documentId={params.documentId} />;
}
