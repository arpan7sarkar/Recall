"use client";

import { MOCK_ITEMS } from "@/lib/mock-data";
import { ItemCard } from "@/components/items/ItemCard";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ArchivePage() {
  const archivedItems = MOCK_ITEMS.filter((i) => i.isArchived);

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

      {archivedItems.length === 0 ? (
        <EmptyState
          icon="📑"
          title="No archived items"
          description="Items you archive will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {archivedItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
