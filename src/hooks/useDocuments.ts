"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

// def useDeleteDocument(): Output is a TanStack Mutation whose
// .mutate(documentId: string) permanently deletes one saved inventory
// (and its whole section/item/quarter-entry tree - see deleteDocument)
// and refreshes the documents list. Called from DocumentList's delete
// control, after the user confirms.
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete inventory");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
