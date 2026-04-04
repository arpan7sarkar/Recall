"use client";

import { useCollections } from "@/hooks/useCollections";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CollectionsPage() {
  const { data: collections, isLoading, error } = useCollections();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Collections
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          {collections?.length || 0} collections
        </p>
      </div>

      {error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
          Failed to load collections.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-slate-50 border border-slate-100 h-40 animate-pulse" />
          ))}
        </div>
      ) : collections?.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No collections"
          description="Create your first collection to start organising your library into themes."
          action={{ label: "Create Collection", onClick: () => {} }} // TODO: Add create modal
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections?.map((col) => (
            <div
              key={col.id}
              className="p-5 rounded-xl card-hover cursor-pointer"
              style={{
                background: "var(--bg-secondary)",
                boxShadow: "var(--shadow-card)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <div
                className="flex items-center justify-center rounded-lg mb-4 text-2xl"
                style={{
                  height: 80,
                  background: "linear-gradient(135deg, var(--accent-50), var(--bg-tertiary))",
                  borderRadius: "var(--radius-md)",
                }}
              >
                📁
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {col.name}
              </h3>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                {col.description}
              </p>
              <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
                <span>{col._count?.items ?? col.itemCount} items</span>
                {col.isPublic && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{ background: "var(--accent-50)", color: "var(--accent-600)" }}
                  >
                    Public
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
