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
      <div className="mb-10 flex flex-col pt-2">
        <h1 className="text-4xl font-serif text-white tracking-tight">
          Your Knowledge Base
        </h1>
        <p className="text-sm font-light text-zinc-500 mt-2">
          {totalItems} items saved · {processingCount} processing
        </p>
      </div>

      {/* Memory resurfacing widget - Obsidian Style */}
      {items.length > 0 && (
        <div className="mb-12 p-8 rounded-2xl relative overflow-hidden bg-[#0e0e0e] border border-white/5 shadow-2xl group transition-all duration-500 hover:border-white/10">
          {/* Subtle glow effect */}
          <div className="absolute inset-x-0 bottom-0 top-0 bg-linear-to-tl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="flex items-start gap-6 relative z-10">
            <div className="p-4 rounded-xl shrink-0 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Icon name="lightbulb" size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-serif text-white tracking-tight mb-2">
                From your memory
              </h2>
              <p className="text-base font-light text-zinc-400 leading-relaxed max-w-2xl">
                You saved <span className="text-indigo-300 font-medium">'{items[0]?.title || "an item"}'</span>. 
                Rethink the connections you've built and how this piece fits into your current workflow.
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
