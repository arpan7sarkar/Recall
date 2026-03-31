"use client";

import { useState } from "react";
import { MOCK_ITEMS } from "@/lib/mock-data";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton";
import { ItemFilters } from "@/components/items/ItemFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { viewMode, setViewMode, openAddContent } = useUIStore();
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading] = useState(false);

  // Filter items using mock data
  const filteredItems =
    activeFilter === "all"
      ? MOCK_ITEMS
      : MOCK_ITEMS.filter((item) => item.itemType === activeFilter);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Your Knowledge Base
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          {MOCK_ITEMS.length} items saved · {MOCK_ITEMS.filter((i) => i.status === "processing").length} processing
        </p>
      </div>

      {/* Memory resurfacing widget mock */}
      <div
        className="mb-8 p-5 rounded-xl"
        style={{
          background: "linear-gradient(135deg, var(--accent-50), var(--warm-100))",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span>💡</span>
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            From your memory
          </h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          You saved &quot;{MOCK_ITEMS[0]?.title}&quot; {" "}
          <span style={{ color: "var(--accent-600)" }}>11 days ago</span>. Maybe it&apos;s
          worth another look?
        </p>
      </div>

      {/* Filters + view toggle */}
      <ItemFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Items grid / list */}
      {isLoading ? (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              : "flex flex-col gap-3"
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <ItemCardSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No items yet"
          description="Start saving articles, videos, and more to build your personal knowledge base."
          action={{
            label: "Add your first item",
            onClick: openAddContent,
          }}
        />
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              : "flex flex-col gap-3"
          )}
        >
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
