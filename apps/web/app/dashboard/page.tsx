"use client";

import { useState } from "react";
import { useItems } from "@/hooks/useItems";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton";
import { ItemFilters } from "@/components/items/ItemFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";

export default function DashboardPage() {
  const { viewMode, setViewMode, openAddContent } = useUIStore();
  const [activeFilter, setActiveFilter] = useState("all");

  const { data, isLoading, error } = useItems({
    type: activeFilter === "all" ? undefined : activeFilter,
    archived: false,
  });

  const items = data?.data || [];
  const totalItems = data?.total || 0;
  const processingCount = items.filter((i: Item) => i.status === "processing").length;

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
          {totalItems} items saved · {processingCount} processing
        </p>
      </div>

      {/* Memory resurfacing widget mock */}
      {items.length > 0 && (
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
            You saved &quot;{items[0]?.title || "an item"}&quot; {" "}
            <span style={{ color: "var(--accent-600)" }}>some time ago</span>. Maybe it&apos;s
            worth another look?
          </p>
        </div>
      )}

      {/* Filters + view toggle */}
      <ItemFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
          Failed to load items. Make sure the backend is running.
        </div>
      ) : isLoading ? (
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
      ) : items.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No items yet"
          description={
            activeFilter === "all"
              ? "Start saving articles, videos, and more to build your personal knowledge base."
              : `No items of type '${activeFilter}' found.`
          }
          action={
            activeFilter === "all"
              ? {
                  label: "Add your first item",
                  onClick: openAddContent,
                }
              : undefined
          }
        />
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              : "flex flex-col gap-3"
          )}
        >
          {items.map((item: Item) => (
            <ItemCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
