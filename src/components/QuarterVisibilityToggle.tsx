"use client";
import { useInventoryStore } from "@/store/useInventoryStore";

// PURE FRONTEND: Four checkboxes ("Q1".."Q4") bound to
// useInventoryStore's visibleQuarters, letting the user show only the
// quarters they currently care about.

export function QuarterVisibilityToggle() {
  const visibleQuarters = useInventoryStore((s) => s.visibleQuarters);
  const setVisibleQuarters = useInventoryStore((s) => s.setVisibleQuarters);

  function toggle(quarter: number) {
    if (visibleQuarters.includes(quarter)) {
      setVisibleQuarters(visibleQuarters.filter((q) => q !== quarter));
    } else {
      setVisibleQuarters([...visibleQuarters, quarter].sort());
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm text-slate-700">
      <span className="font-medium">Quarters:</span>
      {[1, 2, 3, 4].map((quarter) => (
        <label key={quarter} className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={visibleQuarters.includes(quarter)}
            onChange={() => toggle(quarter)}
          />
          Q{quarter}
        </label>
      ))}
    </div>
  );
}
