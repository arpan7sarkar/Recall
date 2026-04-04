"use client";

import { CONTENT_TYPE_FILTERS } from "@/lib/constants";

interface ItemFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function ItemFilters({
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
}: ItemFiltersProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CONTENT_TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 focus-ring"
            style={{
              background:
                activeFilter === filter.value
                  ? "var(--accent-500)"
                  : "transparent",
              color:
                activeFilter === filter.value
                  ? "#fff"
                  : "var(--text-secondary)",
              border:
                activeFilter === filter.value
                  ? "1px solid var(--accent-500)"
                  : "1px solid var(--border)",
              boxShadow: activeFilter === filter.value ? "0 0 15px rgba(6,182,212,0.3)" : "none"
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* View mode toggle */}
      <div
        className="flex items-center rounded-lg overflow-hidden shrink-0"
        style={{ border: "1px solid var(--border)" }}
      >
        <button
          onClick={() => onViewModeChange("grid")}
          className="p-2 transition-colors focus-ring"
          style={{
            background: viewMode === "grid" ? "var(--accent-50)" : "transparent",
            color: viewMode === "grid" ? "var(--accent-600)" : "var(--text-tertiary)",
          }}
          title="Grid view"
          aria-label="Grid view"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className="p-2 transition-colors focus-ring"
          style={{
            background: viewMode === "list" ? "var(--accent-50)" : "transparent",
            color: viewMode === "list" ? "var(--accent-600)" : "var(--text-tertiary)",
          }}
          title="List view"
          aria-label="List view"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="14" height="3" rx="1" />
            <rect x="1" y="7" width="14" height="3" rx="1" />
            <rect x="1" y="12" width="14" height="3" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
