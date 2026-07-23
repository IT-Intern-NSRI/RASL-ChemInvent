"use client";
import { useRouter } from "next/navigation";
import { useDocuments } from "@/hooks/useDocuments";

// PURE FRONTEND: A list of every previously saved inventory (from
// useDocuments), each row showing the year, a status badge (Draft/Final),
// and a "last edited" time, sorted most-recent-first. Clicking a row
// navigates to that document's editable grid at /documents/:id.

export function DocumentList() {
  const router = useRouter();
  const { data: documents, isLoading, isError } = useDocuments();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading saved inventories...</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-600">Could not load saved inventories.</p>;
  }

  if (!documents || documents.length === 0) {
    return <p className="text-sm text-slate-500">No inventories yet. Start a new one above.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
      {documents.map((doc) => (
        <li key={doc.id}>
          <button
            onClick={() => router.push(`/documents/${doc.id}`)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
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
        </li>
      ))}
    </ul>
  );
}
