"use client";
import { useState } from "react";
import { useCreateCatalogItem } from "@/hooks/useCatalog";

// PURE FRONTEND: An inline "add a chemical" form shown under one
// CatalogSection when its "+ Add chemical" control is clicked. Submitting
// creates a new CatalogItem in that section (appended to the end) via
// useCreateCatalogItem and closes itself.

interface AddCatalogItemFormProps {
  sectionId: string;
  onDone: () => void;
}

export function AddCatalogItemForm({ sectionId, onDone }: AddCatalogItemFormProps) {
  const createItem = useCreateCatalogItem();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [catalogNo, setCatalogNo] = useState("");
  const [quantityRaw, setQuantityRaw] = useState("");
  const [footnote, setFootnote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !quantityRaw.trim()) {
      setError("Chemical name and quantity are both required.");
      return;
    }

    try {
      await createItem.mutateAsync({
        sectionId,
        name: name.trim(),
        brand: brand.trim() || null,
        catalogNo: catalogNo.trim() || null,
        quantityRaw: quantityRaw.trim(),
        footnote,
      });
      onDone();
    } catch {
      setError("Could not add this chemical. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Chemical name"
        autoFocus
        className="w-48 rounded border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
      />
      <input
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        placeholder="Brand (optional)"
        className="w-32 rounded border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
      />
      <input
        value={catalogNo}
        onChange={(e) => setCatalogNo(e.target.value)}
        placeholder="Catalog No. (optional)"
        className="w-32 rounded border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
      />
      <input
        value={quantityRaw}
        onChange={(e) => setQuantityRaw(e.target.value)}
        placeholder="Quantity (e.g. 1 x 500g)"
        className="w-40 rounded border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
      />
      <label className="flex items-center gap-1 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={footnote}
          onChange={(e) => setFootnote(e.target.checked)}
        />
        Footnote *
      </label>

      {error && <span className="w-full text-xs text-red-600">{error}</span>}

      <button
        type="submit"
        disabled={createItem.isPending}
        className="rounded bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {createItem.isPending ? "Adding..." : "Add"}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="text-xs text-slate-500 hover:underline"
      >
        Cancel
      </button>
    </form>
  );
}
