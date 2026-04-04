"use client";

import { useState } from "react";
import { useItems } from "@/hooks/useItems";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton";
import { ItemFilters } from "@/components/items/ItemFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/Icon";
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
      <div className="mb-8 flex flex-col pt-2">
        <h1
          className="text-4xl font-black tracking-tighter uppercase"
          style={{ color: "var(--text-primary)" }}
        >
          Your Knowledge Base
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-2" style={{ color: "var(--text-tertiary)" }}>
          {totalItems} items saved · {processingCount} processing
        </p>
      </div>

      {/* Memory resurfacing widget mock */}
      {items.length > 0 && (
        <div
          className="mb-10 p-6 sm:p-8 rounded-4xl relative overflow-hidden backdrop-blur-md"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          {/* Top highlight glow - softened */}
          <div className="absolute top-0 left-1/4 w-1/2 h-px bg-linear-to-r from-transparent via-indigo-400/30 to-transparent opacity-80" />
          
          <div className="flex items-start gap-5">
            <div className="p-3.5 rounded-2xl shrink-0" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
              <Icon name="lightbulb" size={28} className="text-indigo-400" />
            </div>
            <div>
              <h2
                className="text-xl sm:text-2xl font-black tracking-tighter uppercase mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                From your memory
              </h2>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest opacity-40 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                You saved '{items[0]?.title || "an item"}'... A whisper of cyan light <br className="hidden sm:block" />
                reminds you of its value.
              </p>
            </div>
          </div>
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
          icon="library"
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
