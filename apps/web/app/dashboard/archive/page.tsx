"use client";

import { useItems } from "@/hooks/useItems";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";

export default function ArchivePage() {
  const { viewMode } = useUIStore();
  const { data, isLoading, error } = useItems({ archived: true });

  const items = data?.data || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Archive
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Items you&apos;ve archived for later
        </p>
      </div>

      {error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
          Failed to load archived items.
        </div>
      ) : isLoading ? (
        <div className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            : "flex flex-col gap-3"
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ItemCardSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="📑"
          title="No archived items"
          description="Items you archive will appear here."
        />
      ) : (
        <div className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            : "flex flex-col gap-3"
        )}>
          {items.map((item: Item) => (
            <ItemCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
