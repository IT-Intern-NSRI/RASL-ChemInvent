import { PrintableInventory } from "@/components/PrintableInventory";

// PURE FRONTEND (server component): The "view the entire document as a
// whole / print-view" page - renders PrintableInventory full-screen.
export default async function DocumentPrintPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  return <PrintableInventory documentId={documentId} />;
}
