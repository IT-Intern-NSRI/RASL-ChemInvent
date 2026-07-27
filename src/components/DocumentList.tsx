"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useDocuments, useDeleteDocument } from "@/hooks/useDocuments";

// PURE FRONTEND: A list of every previously saved inventory (from
// useDocuments), each row showing the year, a status badge (Draft/Final),
// and a "last edited" time, sorted most-recent-first. Clicking the row's
// main area navigates to that document's editable grid at
// /documents/:id. A separate trash icon lets you permanently delete an
// old inventory - clicking it swaps that row into an inline "Delete
// <year>? / Delete / Cancel" confirmation instead of firing immediately,
// so there's no accidental data loss and no native confirm() popup.

export function DocumentList() {
  const router = useRouter();
  const { data: documents, isLoading, isError } = useDocuments();
  const deleteDocument = useDeleteDocument();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading saved inventories...</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-600">Could not load saved inventories.</p>;
  }

  if (!documents || documents.length === 0) {
    return <p className="text-sm text-slate-500">No inventories yet. Start a new one above.</p>;
  }

  function handleConfirmDelete(documentId: string) {
    deleteDocument.mutate(documentId, {
      onSettled: () => setConfirmingId(null),
    });
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between hover:bg-slate-50">
          <button
            onClick={() => router.push(`/documents/${doc.id}`)}
            className="flex flex-1 items-center justify-between px-4 py-3 text-left"
          >
            <span className="font-medium text-slate-900">{doc.year}</span>
            <span className="flex items-center gap-3">
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs font-medium " +
                  (doc.status === "final"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700")
                }
              >
                {doc.status === "final" ? "Final" : "Draft"}
              </span>
              <span className="text-xs text-slate-400">
                Updated {new Date(doc.updatedAt).toLocaleString()}
              </span>
            </span>
          </button>

          <div className="flex items-center pr-4">
            {confirmingId === doc.id ? (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs text-red-600">Delete {doc.year}?</span>
                <button
                  onClick={() => handleConfirmDelete(doc.id)}
                  disabled={deleteDocument.isPending}
                  className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteDocument.isPending ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setConfirmingId(null)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingId(doc.id)}
                title={`Delete the ${doc.year} inventory`}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
