"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollections, useCreateCollection } from "@/hooks/useCollections";
import { EmptyState } from "@/components/shared/EmptyState";
import { ROUTES } from "@/lib/constants";
import { Icon } from "@/components/shared/Icon";

export default function CollectionsPage() {
  const router = useRouter();
  const { data: collections, isLoading, error } = useCollections();
  const createCollection = useCreateCollection();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
            <div key={i} className="p-5 rounded-xl bg-slate-50 border border-slate-100 h-40 animate-pulse" />
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
              className="p-5 rounded-xl card-hover cursor-pointer"
              onClick={() => router.push(ROUTES.collection(col.id))}
              style={{
                background: "var(--bg-secondary)",
                boxShadow: "var(--shadow-card)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <div
                className="flex items-center justify-center rounded-lg mb-4"
                style={{
                  height: 80,
                  background: "linear-gradient(135deg, var(--accent-50), var(--bg-tertiary))",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <Icon name="collection" size={28} className="opacity-70" />
              </div>

              <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {col.name}
              </h3>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                {col.description || "No description"}
              </p>
              <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
                <span>{col._count?.items ?? col.itemCount ?? 0} items</span>
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
