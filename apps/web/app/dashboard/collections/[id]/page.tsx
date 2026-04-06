"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCollection, useRemoveItemFromCollection } from "@/hooks/useCollections";
import { EmptyState } from "@/components/shared/EmptyState";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { viewMode } = useUIStore();
  const { data: collection, isLoading, error } = useCollection(id);
  const removeItemFromCollection = useRemoveItemFromCollection();
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const handleRemove = async (itemId: string) => {
    try {
      setRemovingItemId(itemId);
      await removeItemFromCollection.mutateAsync({ collectionId: id, itemId });
    } catch (err) {
      console.error("Failed to remove item from collection:", err);
    } finally {
      setRemovingItemId(null);
    }
  };

  return (
    <div>
      <button
        onClick={() => router.push(ROUTES.collections)}
        className="text-sm mb-4 underline"
        style={{ color: "var(--text-secondary)" }}
      >
        Back to Collections
      </button>

      {error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
          Failed to load this collection.
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
      ) : !collection ? (
        <EmptyState
          icon="collection"
          title="Collection not found"
          description="This collection does not exist or you do not have access."
          action={{ label: "Go to Collections", onClick: () => router.push(ROUTES.collections) }}
        />
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {collection.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              {(collection.items?.length ?? 0)} items
            </p>
            {collection.description && (
              <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                {collection.description}
              </p>
            )}
          </div>

          {collection.items.length === 0 ? (
            <EmptyState
              icon="collection"
              title="No items in this collection"
              description="Add items from item details or while saving new content."
              action={{ label: "Go to Dashboard", onClick: () => router.push(ROUTES.dashboard) }}
            />
          ) : (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                : "flex flex-col gap-3"
            )}>
              {collection.items.map((item) => {
                const isRemoving = removingItemId === item.id;
                return (
                  <div key={item.id} className="space-y-2">
                    <ItemCard item={item} viewMode={viewMode} />
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={isRemoving}
                      className="w-full px-3 py-2 rounded-lg text-sm border transition-colors disabled:opacity-60"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                        background: "var(--bg-secondary)",
                      }}
                    >
                      {isRemoving ? "Removing..." : "Remove from Collection"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
