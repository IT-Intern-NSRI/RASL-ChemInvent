"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// PURE FRONTEND: A modal/dialog with a single year input (defaulting to the
// current year) and a "Create" button. Submitting creates a new
// InventoryDocument (which snapshots the master catalog) and navigates to
// that document's editable grid.

interface NewInventoryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewInventoryDialog({ open, onClose }: NewInventoryDialogProps) {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Could not create an inventory for ${year}.`);
        return;
      }
      const document = await res.json();
      router.push(`/documents/${document.id}`);
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Start a new inventory</h2>
        <p className="mb-4 text-sm text-slate-500">
          Copies the current chemical catalog into a fresh, blank inventory for the year below.
        </p>

        <label htmlFor="new-year" className="mb-1 block text-sm font-medium text-slate-700">
          Year
        </label>
        <input
          id="new-year"
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
