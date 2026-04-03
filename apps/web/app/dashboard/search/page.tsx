"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import { ItemCard } from "@/components/items/ItemCard";
import { EmptyState } from "@/components/shared/EmptyState";

type SearchType = "semantic" | "keyword";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";
  const initialType = (searchParams.get("type") as SearchType) ?? "semantic";

  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>(initialType);

  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("type", searchType);
    router.replace(`/dashboard/search?${params.toString()}`, { scroll: false });
  }, [query, searchType, router]);

  const { data: results = [], isLoading, isFetching } = useSearch(query, searchType);

  const isSearching = isLoading || isFetching;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Search
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Search across your entire knowledge base
        </p>
      </div>

      {/* Search input + type toggle */}
      <div className="flex gap-3 mb-8">
        {/* Input with icon */}
        <div className="relative flex-1">
          <div
            className="absolute inset-y-0 left-3 flex items-center pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
          >
            {isSearching && query.length >= 2 ? (
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your knowledge base…"
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none focus-ring"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-lg)",
            }}
            autoFocus
            id="search-page-input"
          />
        </div>

        {/* Search type toggle */}
        <div
          className="flex items-center rounded-xl overflow-hidden shrink-0"
          style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)" }}
        >
          {(["semantic", "keyword"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSearchType(t)}
              className="px-4 py-3 text-xs font-medium capitalize transition-all duration-150"
              style={{
                background: searchType === t ? "var(--accent-50)" : "transparent",
                color: searchType === t ? "var(--accent-600, var(--accent-500))" : "var(--text-tertiary)",
                boxShadow: searchType === t ? "inset 0 0 0 1px var(--accent-200, var(--accent-300))" : "none",
              }}
              id={`search-type-${t}`}
            >
              {t === "semantic" ? "🔮 Semantic" : "🔤 Keyword"}
            </button>
          ))}
        </div>
      </div>

      {/* Mode description */}
      <p className="text-xs mb-6" style={{ color: "var(--text-tertiary)" }}>
        {searchType === "semantic"
          ? "Semantic search finds conceptually related content using AI. Results are ranked by relevance."
          : "Keyword search matches exact text in titles, descriptions, and content."}
      </p>

      {/* Results */}
      {!query || query.length < 2 ? (
        <EmptyState
          icon="🔍"
          title="Search your knowledge"
          description="Type at least 2 characters to search across titles, descriptions, content, and tags."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="skeleton rounded-xl"
              style={{ height: 80 }}
            />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon="😕"
          title="No results found"
          description={`No items match "${query}". Try different keywords or switch to ${searchType === "semantic" ? "keyword" : "semantic"} search.`}
        />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {results.length}
              </span>{" "}
              result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </p>
          </div>
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
