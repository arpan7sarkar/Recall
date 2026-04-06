"use client";

import { useState } from "react";
import { useItems } from "@/hooks/useItems";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemFilters } from "@/components/items/ItemFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/Icon";
import type { Item } from "@/types";

import { LoaderFive, LoaderTwo } from "@/components/ui/unique-loader-components";

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
      <section
        className="mb-10 rounded-2xl border overflow-hidden"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(120deg, color-mix(in srgb, var(--bg-secondary) 92%, black 8%), color-mix(in srgb, var(--bg-secondary) 78%, black 22%))",
        }}
      >
        <div className="relative px-5 py-5 md:px-7 md:py-6">
          <div className="absolute inset-0 pointer-events-none opacity-80 bg-[radial-gradient(circle_at_top_right,rgba(192,192,192,0.16),transparent_52%)]" />
          <div className="relative flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>
              Dashboard
            </p>
            <h1 className="text-4xl font-serif tracking-tight text-(--text-primary)">
              Your Knowledge Base
            </h1>
            <p className="text-sm font-light text-muted-foreground mt-1">
              {totalItems} items saved · {processingCount} processing
            </p>
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <div className="mb-12 p-8 rounded-2xl bg-card border border-border transition-all duration-300">
          <div className="flex items-start gap-6 relative z-10">
            <div className="p-4 rounded-xl shrink-0 bg-(--accent-500)/10 border border-(--accent-500)/20 text-accent">
              <Icon name="lightbulb" size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-serif text-(--text-primary) tracking-tight mb-2">
                From your memory
              </h2>
              <p className="text-base font-light text-muted-foreground leading-relaxed max-w-2xl">
                You saved{" "}
                <span className="text-accent font-medium">
                  &apos;{items[0]?.title || "an item"}&apos;
                </span>
                . Rethink the connections you&apos;ve built and how this piece fits into your current workflow.
              </p>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
          <LoaderFive text="Initializing your Second Brain" />
          <div className="mt-4 opacity-50">
            <LoaderTwo />
          </div>
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
