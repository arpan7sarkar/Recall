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
                ? "bg-indigo-500/10 text-white border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                : "bg-transparent text-zinc-500 border-white/4 hover:border-white/10 hover:text-zinc-400"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center rounded-lg overflow-hidden shrink-0 border border-white/4 bg-black/20">
        <button
          onClick={() => onViewModeChange("grid")}
          className={cn(
            "p-2 transition-all duration-300",
            viewMode === "grid" ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-600 hover:text-zinc-400"
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
            viewMode === "list" ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-600 hover:text-zinc-400"
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
