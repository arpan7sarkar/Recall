"use client";

import { useRelatedItems } from "@/hooks/useItems";
import { ItemCard } from "./ItemCard";
import type { Item } from "@/types";

interface RelatedItemsProps {
  itemId: string;
}

export function RelatedItems({ itemId }: RelatedItemsProps) {
  const { data: relatedItems, isLoading } = useRelatedItems(itemId);

  if (isLoading) {
    return (
      <div className="mt-12">
        <h2 className="text-lg font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          Related Items
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!relatedItems || relatedItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-lg font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Related Items
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedItems.map((item: Item) => (
          <ItemCard key={item.id} item={item} viewMode="list" />
        ))}
      </div>
    </div>
  );
}
