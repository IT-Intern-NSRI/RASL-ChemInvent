"use client";
import { useState } from "react";
import { NewInventoryDialog } from "./NewInventoryDialog";
import { DocumentList } from "./DocumentList";

// PURE FRONTEND: The first screen a logged-in user sees. Shows two clear
// choices - "Start New Inventory" (opens NewInventoryDialog) and "Continue
// Existing Inventory" (renders DocumentList below it). This is the
// "prompted if they want to start a new Inventory or load an old one"
// screen from the project spec.

export function StartupScreen() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Digital Chemical Inventory</h1>
      <p className="mb-8 text-sm text-slate-500">
        U.P. NSRI - RASL Quarterly Inventory of Priority Chemicals
      </p>

      <button
        onClick={() => setDialogOpen(true)}
        className="mb-8 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Start New Inventory
      </button>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Continue Existing Inventory
      </h2>
      <DocumentList />

      <NewInventoryDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
