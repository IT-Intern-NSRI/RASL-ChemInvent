"use client";
import { useInventoryStore } from "@/store/useInventoryStore";

// PURE FRONTEND: A text input bound to useInventoryStore's searchTerm,
// filtering InventoryTable's rows by chemical name / brand / catalog
// number as the user types.

export function ChemicalSearchBox() {
  const searchTerm = useInventoryStore((s) => s.searchTerm);
  const setSearchTerm = useInventoryStore((s) => s.setSearchTerm);

  return (
    <input
      type="search"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search chemicals..."
      className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
    />
  );
}
