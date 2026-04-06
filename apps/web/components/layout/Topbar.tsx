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

  useKeyboardShortcut("k", () => {
    document.getElementById("global-search")?.focus();
  });

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
      className="shrink-0 flex items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 lg:gap-4 lg:px-6 rounded-xl sm:rounded-2xl border border-border shadow-sm bg-(--bg-secondary)/80 backdrop-blur-xl relative z-20 h-14 sm:h-16"
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg focus-ring transition-colors bg-muted text-muted-foreground hover:text-(--text-primary) shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search bar with live dropdown */}
      <div className="relative flex-1 min-w-0 flex justify-end max-w-2xl">
        <form onSubmit={handleSearch} className="w-full max-w-xl min-w-0">
          <div
            className={cn(
              "flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full transition-all duration-300 border bg-(--bg-primary)/40",
              showDropdown && searchQuery.length >= 2 ? "border-(--accent-500)/50 shadow-[0_0_15px_rgba(192,192,192,0.1)]" : "border-border"
            )}
          >
            <div className="flex items-center justify-center opacity-40 shrink-0" style={{ width: 14 }}>
              <Icon name="search" size={14} />
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
              placeholder="Search..."
              className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-light text-(--text-primary) outline-none placeholder:text-(--text-tertiary)"
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
                className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-(--bg-tertiary)/50 text-(--text-tertiary) border border-border"
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

      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
        {/* Add Content CTA */}
        <button
          onClick={openAddContent}
          className={cn(
            "flex items-center justify-center gap-2 rounded-full font-serif text-xs transition-all duration-300 hover:scale-102 active:scale-97",
            "h-9 w-9 sm:h-auto sm:w-auto sm:px-5 lg:px-8 sm:py-2",
            "bg-accent text-background hover:opacity-90"
          )}
          id="add-content-btn"
          aria-label="Add content"
        >
          <Icon name="plus" size={16} />
          <span className="hidden sm:inline">Add Content</span>
          <span className="hidden lg:inline ml-1 px-1.5 py-0.5 text-[8px] rounded bg-white/20 uppercase ">Alt+N</span>
        </button>

        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-9 h-9 rounded-full border border-border shadow-sm",
            },
          }}
        />
      </div>
    </header>
  );
}
