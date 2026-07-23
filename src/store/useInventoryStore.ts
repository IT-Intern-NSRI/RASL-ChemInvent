// Client-side view state for the editable grid: which quarters are shown,
// the search box value, and which chemicals are pinned into an "only show
// selected" view. Deliberately does NOT hold saved data (current inventory
// / for purchase values) - that lives in the TanStack Query cache via
// useDocument, so server data and view preferences don't get tangled.
//
// These setters are one-liners with no real design decision left to make,
// so - unlike the services layer - they're written out directly rather
// than left as a stub.
import { create } from "zustand";

interface InventoryUIState {
  visibleQuarters: number[];
  searchTerm: string;
  pinnedItemIds: string[];

  setVisibleQuarters: (quarters: number[]) => void;
  setSearchTerm: (term: string) => void;
  togglePinnedItem: (docItemId: string) => void;
  clearPinnedItems: () => void;
}

export const useInventoryStore = create<InventoryUIState>((set) => ({
  visibleQuarters: [1, 2, 3, 4],
  searchTerm: "",
  pinnedItemIds: [],

  setVisibleQuarters: (quarters) => set({ visibleQuarters: quarters }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  togglePinnedItem: (docItemId) =>
    set((state) => ({
      pinnedItemIds: state.pinnedItemIds.includes(docItemId)
        ? state.pinnedItemIds.filter((id) => id !== docItemId)
        : [...state.pinnedItemIds, docItemId],
    })),
  clearPinnedItems: () => set({ pinnedItemIds: [] }),
}));
