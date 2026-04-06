"use client";

import { useParams } from "next/navigation";
import { usePublicCollection } from "@/hooks/useCollections";
import { EmptyState } from "@/components/shared/EmptyState";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { TagChip } from "@/components/shared/TagChip";
import type { Item } from "@/types";

export default function PublicCollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: collection, isLoading, error } = usePublicCollection(slug);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-3 mb-8">
          <div className="h-8 w-60 animate-pulse rounded-lg" style={{ background: "var(--bg-tertiary)" }} />
          <div className="h-4 w-80 animate-pulse rounded-lg" style={{ background: "var(--bg-tertiary)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-xl animate-pulse"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <EmptyState
          icon="collection"
          title="Shared collection not found"
          description="This link is invalid or the owner disabled sharing."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
          Shared Collection
        </p>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          {collection.name}
        </h1>
        {collection.description && (
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            {collection.description}
          </p>
        )}
        <p className="text-sm mt-3" style={{ color: "var(--text-tertiary)" }}>
          {collection.items.length} items
        </p>
      </div>

      {collection.items.length === 0 ? (
        <EmptyState
          icon="collection"
          title="No items in this collection"
          description="The collection owner has not added any visible items yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collection.items.map((item: Item) => (
            <article
              key={item.id}
              className="rounded-xl p-4 border"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <TypeBadge type={item.itemType} size="sm" />
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline"
                    style={{ color: "var(--accent-500)" }}
                  >
                    Open Source
                  </a>
                )}
              </div>
              <h2 className="text-base font-semibold mb-2 line-clamp-2" style={{ color: "var(--text-primary)" }}>
                {item.title || "Untitled"}
              </h2>
              {item.description && (
                <p className="text-sm line-clamp-3 mb-3" style={{ color: "var(--text-secondary)" }}>
                  {item.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {item.tags.slice(0, 5).map((tag) => (
                  <TagChip
                    key={`${item.id}-${tag.tagId}`}
                    name={tag.tagName}
                    color={tag.tagColor}
                    isAiGenerated={tag.isAiGenerated}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
