"use client";
import { useIsMutating } from "@tanstack/react-query";

// PURE FRONTEND: A small "Saved" / "Saving..." pill shown near the top of
// the editable grid, reflecting whether any entry-save mutation
// (useUpdateEntry) is currently in flight.

export function SaveStatusBadge() {
  const pendingSaves = useIsMutating();

  return (
    <span
      className={
        "rounded-full px-2 py-0.5 text-xs font-medium " +
        (pendingSaves > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")
      }
    >
      {pendingSaves > 0 ? "Saving..." : "Saved"}
    </span>
  );
}
