"use client";
import { useState } from "react";

// PURE FRONTEND: A single collapsible group-header row inside
// InventoryTable, representing one category or sub-category (e.g. "I.
// Oxidizing Agents" or "Acids II -Toxic"). Shows the section label, an
// expand/collapse chevron, and indentation proportional to its depth in the
// tree. Its children (nested sections and/or ItemRows, passed in as
// `children`) render below it when expanded.

interface CategoryGroupRowProps {
  label: string;
  level: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function CategoryGroupRow({
  label,
  level,
  defaultExpanded = true,
  children,
}: CategoryGroupRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <>
      <tr className="bg-slate-100">
        {/* colSpan is set generously; browsers clamp it to the table's actual column count. */}
        <td colSpan={999} className="px-2 py-1.5">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
            style={{ paddingLeft: `${level * 16}px` }}
          >
            <span className="inline-block w-3 text-slate-400">{expanded ? "\u25BE" : "\u25B8"}</span>
            {label}
          </button>
        </td>
      </tr>
      {expanded && children}
    </>
  );
}
