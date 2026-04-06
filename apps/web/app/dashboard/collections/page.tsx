"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollections, useCreateCollection, useDeleteCollection } from "@/hooks/useCollections";
import { EmptyState } from "@/components/shared/EmptyState";
import { ROUTES } from "@/lib/constants";
import { Icon } from "@/components/shared/Icon";

export default function CollectionsPage() {
  const router = useRouter();
  const { data: collections, isLoading, error } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsPublic(false);
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
        isPublic,
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Collections
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            {collections?.length || 0} collections
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="btn-primary focus-ring rounded-lg px-4 py-2 text-sm font-medium"
        >
          {showCreateForm ? "Cancel" : "Create Collection"}
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 rounded-xl space-y-3"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product Research"
              className="w-full px-3 py-2 rounded-lg text-sm focus-ring"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
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
              className="w-full px-3 py-2 rounded-lg text-sm focus-ring"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Make this collection public
          </label>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <button
            type="submit"
            disabled={createCollection.isPending}
            className="btn-primary focus-ring rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {createCollection.isPending ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
          Failed to load collections.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl h-40 animate-pulse"
              style={{
                background: "var(--bg-secondary)",
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
                  "linear-gradient(to top left, rgba(99,102,241,0.1), rgba(0,0,0,0.2)), url('/collection-bg.jpg')",
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
    </div>
  );
}
