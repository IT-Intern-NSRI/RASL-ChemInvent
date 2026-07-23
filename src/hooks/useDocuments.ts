"use client";
import { useQuery } from "@tanstack/react-query";
import type { InventoryDocumentSummaryDTO } from "@/types";

// def useDocuments(): Input is nothing (a React hook, called with no
// arguments). Output is a TanStack Query result wrapping
// InventoryDocumentSummaryDTO[] - feeds the DocumentList component on the
// startup screen.
export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async (): Promise<InventoryDocumentSummaryDTO[]> => {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      return res.json();
    },
  });
}
