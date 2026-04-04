"use client";

import { CONTENT_TYPE_FILTERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
    <div className="flex items-center justify-between gap-4 mb-10 overflow-hidden">
      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        {CONTENT_TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "px-5 py-1.5 rounded-full text-xs font-light tracking-tight transition-all duration-300 border",
              activeFilter === filter.value
                ? "bg-[var(--accent-500)]/10 text-[var(--text-primary)] border-[var(--accent-500)]/30 shadow-[0_0_15px_rgba(192,192,192,0.1)]"
                : "bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center rounded-lg overflow-hidden shrink-0 border border-[var(--border)] bg-[var(--bg-primary)]/40">
        <button
          onClick={() => onViewModeChange("grid")}
          className={cn(
            "p-2 transition-all duration-300",
            viewMode === "grid" ? "bg-[var(--accent-500)]/10 text-[var(--accent-500)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
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
          className={cn(
            "p-2 transition-all duration-300",
            viewMode === "list" ? "bg-[var(--accent-500)]/10 text-[var(--accent-500)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          )}
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
