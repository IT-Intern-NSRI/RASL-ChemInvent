"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateQuarterEntryInput } from "@/types";

// def useUpdateEntry(documentId): Input is the current document's id (used
// to invalidate the right cached query after a save). Output is a TanStack
// Mutation whose .mutate(input: UpdateQuarterEntryInput) saves one cell's
// edit and refreshes the document query - called from
// CurrentInventoryCell / ForPurchaseCell on blur.
export function useUpdateEntry(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateQuarterEntryInput) => {
      const res = await fetch(`/api/documents/${documentId}/entries`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to save entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    },
  });
}
