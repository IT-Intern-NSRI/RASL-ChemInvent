import Link from "next/link";
import { CatalogManager } from "@/components/CatalogManager";

// PURE FRONTEND (server component): The "manage master catalog" screen -
// add new chemicals and edit the fields of existing ones. See
// CatalogManager for the editable grid itself, and its comment for why
// edits here never rewrite an already-saved InventoryDocument.
export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-2 flex items-center gap-3">
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          &larr; Back
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">Manage Master Catalog</h1>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Add or edit chemicals in the master list. This does not change any inventory that has
        already been started - each saved year keeps its own snapshot. New chemicals, and edits
        made here, appear the next time someone starts a new year&apos;s inventory.
      </p>
      <CatalogManager />
    </div>
  );
}
