"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollections, useCreateCollection, useDeleteCollection } from "@/hooks/useCollections";
import { EmptyState } from "@/components/shared/EmptyState";
import { ROUTES } from "@/lib/constants";
import { Icon } from "@/components/shared/Icon";
import { useUIStore } from "@/store/uiStore";

export default function CollectionsPage() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { data: collections, isLoading, error } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setFormError("Collection name is required.");
      return;
    }

    try {
      const created = await createCollection.mutateAsync({
        name: normalizedName,
        description: description.trim() || undefined,
      });
      resetForm();
      setShowCreateForm(false);
      router.push(ROUTES.collection(created.id));
    } catch (err: unknown) {
      const apiError =
        typeof err === "object" && err !== null && "body" in err
          ? (err as { body?: { error?: string } }).body?.error
          : undefined;
      setFormError(apiError ?? "Failed to create collection.");
    }
  };

  const handleDeleteCollection = async (
    e: React.MouseEvent<HTMLButtonElement>,
    collectionId: string,
    collectionName: string
  ) => {
    e.stopPropagation();

    const confirmed = window.confirm(`Delete "${collectionName}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingId(collectionId);
      await deleteCollection.mutateAsync(collectionId);
    } catch {
      setFormError("Failed to delete collection.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <section
        className="mb-8 rounded-2xl border overflow-hidden"
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(120deg, color-mix(in srgb, var(--bg-secondary) 92%, black 8%), color-mix(in srgb, var(--bg-secondary) 78%, black 22%))",
        }}
      >
        <div className="relative px-5 py-5 md:px-7 md:py-6">
          <div className="absolute inset-0 pointer-events-none opacity-80 bg-[radial-gradient(circle_at_top_right,rgba(192,192,192,0.16),transparent_52%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-tertiary)" }}>
                Collections
              </p>
              <h1 className="text-3xl font-serif tracking-tight" style={{ color: "var(--text-primary)" }}>
                Collection Library
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                {collections?.length || 0} collections
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                background: "color-mix(in srgb, var(--bg-primary) 84%, black 16%)",
              }}
            >
              {showCreateForm ? "Cancel" : "Create Collection"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div
          className="p-8 text-center rounded-lg border"
          style={{
            color: "color-mix(in srgb, #ef4444 70%, var(--text-primary) 30%)",
            background: "color-mix(in srgb, var(--bg-secondary) 88%, #b91c1c 12%)",
            borderColor: "color-mix(in srgb, var(--border) 50%, #dc2626 50%)",
          }}
        >
          Failed to load collections.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl h-40 animate-pulse"
              style={{
                background:
                  "linear-gradient(120deg, color-mix(in srgb, var(--bg-secondary) 92%, var(--text-primary) 8%), color-mix(in srgb, var(--bg-tertiary) 90%, var(--text-primary) 10%))",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            />
          ))}
        </div>
      ) : collections?.length === 0 ? (
        <EmptyState
          icon="collection"
          title="No collections"
          description="Create your first collection to start organising your library into themes."
          action={{ label: "Create Collection", onClick: () => setShowCreateForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections?.map((col) => (
            <div
              key={col.id}
              className="flex flex-col overflow-hidden cursor-pointer transition-all duration-700 border rounded-2xl bg-card/40 backdrop-blur-md border-border hover:border-accent/40 group min-h-[320px] h-full"
              onClick={() => router.push(ROUTES.collection(col.id))}
              style={{
                backgroundImage:
                  theme === "light"
                    ? "linear-gradient(to top left, rgba(248,250,252,0.45), rgba(226,232,240,0.3)), url('/collection-bg-light.png')"
                    : "linear-gradient(to top left, rgba(99,102,241,0.1), rgba(0,0,0,0.2)), url('/collection-bg.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                className="relative flex items-center justify-center h-32 border-b border-border"
                style={{
                  background: "linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.35))",
                }}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
                <div className="relative z-10 w-10 h-10 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <Icon name="collection" size={20} className="opacity-90 text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-2 p-5 flex-1 relative">
                <div className="absolute inset-x-0 bottom-0 top-0 bg-linear-to-tl from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <h3 className="text-lg font-serif italic text-white/95 tracking-tight line-clamp-2 relative z-10 group-hover:text-accent transition-colors duration-500">
                  {col.name}
                </h3>
                <p className="text-xs font-serif italic text-white/70 line-clamp-3 mt-1 relative z-10 group-hover:text-white/85 transition-colors duration-500">
                  {col.description || "No description"}
                </p>
                <div className="mt-auto flex items-center justify-between text-xs relative z-10 text-white/75">
                  <span>{col._count?.items ?? col.itemCount ?? 0} items</span>
                  <div className="flex items-center gap-2">
                    {col.isPublic && (
                      <span className="px-2 py-0.5 rounded-full text-xs border border-white/25 bg-white/10 text-white">
                        Public
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDeleteCollection(e, col.id, col.name)}
                      disabled={deletingId === col.id}
                      className="px-2 py-0.5 rounded-full text-xs border border-white/25 bg-black/25 text-white disabled:opacity-60"
                    >
                      {deletingId === col.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setShowCreateForm(false)}
          />

          <form
            onSubmit={handleCreate}
            className="relative w-full max-w-lg p-5 rounded-xl border space-y-3 overflow-hidden"
            style={{
              borderColor: "var(--border)",
              background:
                "linear-gradient(120deg, color-mix(in srgb, var(--bg-secondary) 92%, black 8%), color-mix(in srgb, var(--bg-secondary) 78%, black 22%))",
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-80 bg-[radial-gradient(circle_at_top_right,rgba(192,192,192,0.16),transparent_52%)]" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  Create Collection
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-2 py-1 text-xs rounded-md border"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                    background: "var(--bg-primary)",
                  }}
                >
                  Close
                </button>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Product Research"
                  className="w-full px-3 py-2 rounded-lg text-sm focus-ring border"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What goes in this collection?"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm focus-ring border"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div>
                <button
                  type="submit"
                  disabled={createCollection.isPending}
                  className="px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                    background: "var(--bg-primary)",
                  }}
                >
                  {createCollection.isPending ? "Creating..." : "Create Collection"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
