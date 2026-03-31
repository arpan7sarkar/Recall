"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_ITEMS } from "@/lib/mock-data";
import { ItemCard } from "@/components/items/ItemCard";
import { EmptyState } from "@/components/shared/EmptyState";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<"semantic" | "keyword">("semantic");

  const results = query.trim()
    ? MOCK_ITEMS.filter(
        (i) =>
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.description?.toLowerCase().includes(query.toLowerCase()) ||
          i.tags.some((t) => t.tagName.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Search
        </h1>
      </div>

      {/* Search input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your knowledge base…"
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none focus-ring"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-lg)",
          }}
          autoFocus
        />
        <div
          className="flex items-center rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: "1px solid var(--border)" }}
        >
          {(["semantic", "keyword"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSearchType(t)}
              className="px-3 py-3 text-xs font-medium capitalize transition-colors"
              style={{
                background: searchType === t ? "var(--accent-50)" : "transparent",
                color: searchType === t ? "var(--accent-600)" : "var(--text-tertiary)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {!query.trim() ? (
        <EmptyState
          icon="🔍"
          title="Search your knowledge"
          description="Type a query to search by title, description, or tags."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon="😕"
          title="No results found"
          description={`No items match "${query}". Try different keywords.`}
        />
      ) : (
        <div>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
          </p>
          <div className="flex flex-col gap-3">
            {results.map((item) => (
              <ItemCard key={item.id} item={item} viewMode="list" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
