"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useSearch } from "@/hooks/useSearch";
import { SearchDropdown } from "./SearchDropdown";
import { UserButton } from "@clerk/nextjs";
import { Icon } from "@/components/shared/Icon";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { openAddContent, toggleSidebar } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  // Live search results (debounced inside useSearch)
  const { data: searchResults = [], isLoading: isSearching } = useSearch(
    searchQuery,
    "semantic"
  );

  useKeyboardShortcut("k", openAddContent);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setShowDropdown(false);
    }
  };

  const closeDropdown = useCallback(() => setShowDropdown(false), []);

  return (
    <header
      className="shrink-0 flex items-center justify-between gap-4 px-6 rounded-2xl border border-[var(--border)] shadow-sm bg-[var(--bg-secondary)]/80 backdrop-blur-xl relative z-20 h-16"
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg focus-ring transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search bar with live dropdown */}
      <div className="relative flex-1 flex justify-end max-w-2xl ml-auto">
        <form onSubmit={handleSearch} className="w-full max-w-xl">
          <div
            className={cn(
              "flex items-center gap-3 px-5 py-2 rounded-full transition-all duration-300 border bg-[var(--bg-primary)]/40",
              showDropdown && searchQuery.length >= 2 ? "border-[var(--accent-500)]/50 shadow-[0_0_15px_rgba(192,192,192,0.1)]" : "border-[var(--border)]"
            )}
          >
            <div className="flex items-center justify-center opacity-40" style={{ width: 16 }}>
              <Icon name="search" size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(e.target.value.length >= 2);
              }}
              onFocus={() => {
                if (searchQuery.length >= 2) setShowDropdown(true);
              }}
              placeholder="Search your mind..."
              className="flex-1 bg-transparent text-sm font-light text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              id="global-search"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowDropdown(false);
                }}
                className="flex items-center justify-center p-1 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                aria-label="Clear search"
              >
                <Icon name="close" size={14} />
              </button>
            )}
            {!searchQuery && (
              <kbd
                className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-tertiary)]/50 text-[var(--text-tertiary)] border border-[var(--border)]"
              >
                ⌘K
              </kbd>
            )}
          </div>
        </form>

        {/* Live dropdown overlay */}
        {showDropdown && (
          <SearchDropdown
            results={searchResults}
            isLoading={isSearching}
            query={searchQuery}
            onClose={closeDropdown}
          />
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Add Content CTA */}
        <button
          onClick={openAddContent}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-full font-serif text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(var(--accent-500-rgb),0.3)] dark:shadow-[0_0_30px_rgba(255,255,255,0.05)]",
            "bg-[var(--accent-500)] text-[var(--bg-primary)] hover:opacity-90"
          )}
          id="add-content-btn"
        >
          <Icon name="plus" size={16} />
          <span className="hidden sm:inline">Add Content</span>
        </button>

        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-9 h-9 rounded-full border border-[var(--border)] shadow-sm",
            },
          }}
        />
      </div>
    </header>
  );
}
