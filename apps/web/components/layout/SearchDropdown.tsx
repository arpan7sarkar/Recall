"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Item } from "@/types";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { timeAgo, extractDomain } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { LoaderFive } from "@/components/ui/unique-loader-components";

interface SearchDropdownProps {
  results: Item[];
  isLoading: boolean;
  query: string;
  onClose: () => void;
}

export function SearchDropdown({ results, isLoading, query, onClose }: SearchDropdownProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  if (!query || query.length < 2) return null;

  const handleViewAll = () => {
    router.push(`/dashboard/search?q=${encodeURIComponent(query)}`);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.18))",
        maxHeight: 400,
        overflowY: "auto",
      }}
      id="search-dropdown"
    >
      {isLoading ? (
        <div className="px-4 py-8 flex flex-col items-center justify-center gap-4">
          <LoaderFive text="Searching your mind" />
        </div>
      ) : results.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
          No results for &ldquo;{query}&rdquo;
        </div>
      ) : (
        <>
          <div className="py-1">
            {results.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={ROUTES.item(item.id)}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{ color: "var(--text-primary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary, var(--bg-primary))")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                id={`search-result-${item.id}`}
              >
                {/* Type icon */}
                <div
                  className="flex shrink-0 items-center justify-center rounded-lg text-base"
                  style={{
                    width: 36,
                    height: 36,
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <TypeBadge type={item.itemType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title || "Untitled"}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {extractDomain(item.url)} · {timeAgo(item.savedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* View all results link */}
          <div style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={handleViewAll}
              className="w-full px-4 py-3 text-xs font-medium text-left transition-colors"
              style={{ color: "var(--accent-600, var(--accent-500))" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-50)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              View all {results.length} results for &ldquo;{query}&rdquo; →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
