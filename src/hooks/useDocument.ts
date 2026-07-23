"use client";
import { useQuery } from "@tanstack/react-query";
import type { InventoryDocumentFullDTO } from "@/types";

// def useDocument(documentId): Input is a document id (or undefined while
// navigation is in flight). Output is a TanStack Query result wrapping
// InventoryDocumentFullDTO - feeds InventoryTable and PrintableInventory.
export function useDocument(documentId: string | undefined) {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: async (): Promise<InventoryDocumentFullDTO> => {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) throw new Error("Failed to load document");
      return res.json();
    },
    enabled: !!documentId,
  });
}
