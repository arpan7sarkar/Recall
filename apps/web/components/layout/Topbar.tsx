"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

export function Topbar() {
  const { openAddContent, toggleSidebar } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useKeyboardShortcut("k", openAddContent);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-4 px-6 border-b"
      style={{
        height: "var(--topbar-height)",
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg focus-ring"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-shadow"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your knowledge…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            id="global-search"
          />
          <kbd
            className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-tertiary)",
              border: "1px solid var(--border)",
            }}
          >
            ⌘K
          </kbd>
        </div>
      </form>

      {/* Add Content CTA */}
      <button
        onClick={openAddContent}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all duration-150 focus-ring"
        style={{
          background: "var(--accent-500)",
          borderRadius: "var(--radius-md)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-600)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-500)")}
        id="add-content-btn"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Add Content</span>
      </button>
    </header>
  );
}
