"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocSectionDTO, CreateCatalogItemInput, UpdateCatalogItemInput } from "@/types";

// def useCatalog(): Input is nothing. Output is a TanStack Query result
// wrapping the master catalog tree (one node per Lab at the root,
// CatalogSections nested below, chemicals as items with blank quarters -
// see getMasterCatalogTree) - feeds CatalogManager.
export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: async (): Promise<DocSectionDTO[]> => {
      const res = await fetch("/api/catalog");
      if (!res.ok) throw new Error("Failed to load master catalog");
      return res.json();
    },
  });
}

// def useCreateCatalogItem(): Output is a TanStack Mutation whose
// .mutate(input: CreateCatalogItemInput) adds a new chemical to a section
// and refreshes the catalog query - called from AddCatalogItemForm.
export function useCreateCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCatalogItemInput) => {
      const res = await fetch("/api/catalog/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to add chemical");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

// def useUpdateCatalogItem(): Output is a TanStack Mutation whose
// .mutate({ itemId, ...fields }) saves an edit to one existing chemical and
// refreshes the catalog query - called on field blur from CatalogItemRow.
export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      ...input
    }: { itemId: string } & UpdateCatalogItemInput) => {
      const res = await fetch(`/api/catalog/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update chemical");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}
