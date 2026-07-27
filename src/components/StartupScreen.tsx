"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NewInventoryDialog } from "./NewInventoryDialog";
import { DocumentList } from "./DocumentList";

// PURE FRONTEND: The first screen a logged-in user sees. Shows two clear
// choices - "Start New Inventory" (opens NewInventoryDialog) and "Continue
// Existing Inventory" (renders DocumentList below it), plus a sign-out
// control - this is the only place in the app that needs one, since every
// other page is reachable only from here. This is the "prompted if they
// want to start a new Inventory or load an old one" screen from the
// project spec.

export function StartupScreen() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleSignOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold text-slate-900">
            Digital Chemical Inventory
          </h1>
          <p className="text-sm text-slate-500">
            U.P. NSRI - RASL Quarterly Inventory of Priority Chemicals
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
        >
          Sign out
        </button>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setDialogOpen(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Start New Inventory
        </button>
        <Link
          href="/catalog"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Manage Chemical Catalog
        </Link>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Continue Existing Inventory
      </h2>
      <DocumentList />

      <NewInventoryDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
