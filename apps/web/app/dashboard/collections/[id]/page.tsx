"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useCollection,
  useRemoveItemFromCollection,
  useShareCollection,
  useUnshareCollection,
  useDeleteCollection,
  useUpdateCollection,
} from "@/hooks/useCollections";
import { EmptyState } from "@/components/shared/EmptyState";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { viewMode } = useUIStore();
  const { data: collection, isLoading, error } = useCollection(id);
  const removeItemFromCollection = useRemoveItemFromCollection();
  const shareCollection = useShareCollection();
  const unshareCollection = useUnshareCollection();
  const deleteCollection = useDeleteCollection();
  const updateCollection = useUpdateCollection();
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);

  const isSharing = shareCollection.isPending || unshareCollection.isPending;

  useEffect(() => {
    if (!collection) return;
    setEditName(collection.name ?? "");
    setEditDescription(collection.description ?? "");
    setEditIsPublic(Boolean(collection.isPublic));
  }, [collection]);

  const handleRemove = async (itemId: string) => {
    try {
      setRemovingItemId(itemId);
      await removeItemFromCollection.mutateAsync({ collectionId: id, itemId });
    } catch (err) {
      console.error("Failed to remove item from collection:", err);
    } finally {
      setRemovingItemId(null);
    }
  };

  const buildShareUrl = (slug: string) => `${window.location.origin}${ROUTES.publicCollection(slug)}`;

  const handleShare = async (regenerate = false) => {
    try {
      const result = await shareCollection.mutateAsync({ id, regenerate });
      if (result.publicSlug) {
        await navigator.clipboard.writeText(buildShareUrl(result.publicSlug));
        setShareMessage(regenerate ? "New share link copied." : "Share link copied.");
      }
    } catch {
      setShareMessage("Failed to share this collection.");
    }
  };

  const handleUnshare = async () => {
    try {
      await unshareCollection.mutateAsync({ id });
      setShareMessage("Public link disabled.");
    } catch {
      setShareMessage("Failed to disable sharing.");
    }
  };

  const handleCopyExistingLink = async () => {
    if (!collection?.publicSlug) return;
    try {
      await navigator.clipboard.writeText(buildShareUrl(collection.publicSlug));
      setShareMessage("Link copied.");
    } catch {
      setShareMessage("Could not copy link.");
    }
  };

  const handleDeleteCollection = async () => {
    if (!collection) return;
    const confirmed = window.confirm(`Delete "${collection.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteCollection.mutateAsync(collection.id);
      router.push(ROUTES.collections);
    } catch {
      setShareMessage("Failed to delete collection.");
    }
  };

  const handleUpdateCollection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!collection) return;

    const normalizedName = editName.trim();
    if (!normalizedName) {
      setEditMessage("Collection name is required.");
      return;
    }

    try {
      setEditMessage(null);
      await updateCollection.mutateAsync({
        id: collection.id,
        name: normalizedName,
        description: editDescription.trim() || undefined,
        isPublic: editIsPublic,
      });
      setEditMessage("Collection updated.");
      setShowEditModal(false);
    } catch (err: unknown) {
      const apiError =
        typeof err === "object" && err !== null && "body" in err
          ? (err as { body?: { error?: string } }).body?.error
          : undefined;
      setEditMessage(apiError ?? "Failed to update collection.");
    }
  };

  return (
    <div>
      <button
        onClick={() => router.push(ROUTES.collections)}
        className="text-sm mb-4 underline"
        style={{ color: "var(--text-secondary)" }}
      >
        Back to Collections
      </button>

      {error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
          Failed to load this collection.
        </div>
      ) : isLoading ? (
        <div className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            : "flex flex-col gap-3"
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ItemCardSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      ) : !collection ? (
        <EmptyState
          icon="collection"
          title="Collection not found"
          description="This collection does not exist or you do not have access."
          action={{ label: "Go to Collections", onClick: () => router.push(ROUTES.collections) }}
        />
      ) : (
        <>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {collection.name}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                {(collection.items?.length ?? 0)} items
              </p>
              {collection.description && (
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                  {collection.description}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setEditMessage(null);
                setShowEditModal(true);
              }}
              className="px-3 py-2 rounded-lg text-sm border"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                background: "var(--bg-secondary)",
              }}
            >
              Edit Collection
            </button>
          </div>

          <div
            className="mb-6 p-4 rounded-xl border"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
              Share Collection
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleShare(false)}
                disabled={isSharing}
                className="px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  background: "var(--bg-primary)",
                }}
              >
                {collection.isPublic ? "Copy Share Link" : "Share via Link"}
              </button>

              {collection.isPublic && collection.publicSlug && (
                <button
                  onClick={() => handleShare(true)}
                  disabled={isSharing}
                  className="px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                    background: "var(--bg-primary)",
                  }}
                >
                  Regenerate Link
                </button>
              )}

              {collection.isPublic && (
                <button
                  onClick={handleUnshare}
                  disabled={isSharing}
                  className="px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                    background: "var(--bg-primary)",
                  }}
                >
                  Disable Link
                </button>
              )}

              {collection.isPublic && collection.publicSlug && (
                <button
                  onClick={handleCopyExistingLink}
                  disabled={isSharing}
                  className="px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                    background: "var(--bg-primary)",
                  }}
                >
                  Copy Current Link
                </button>
              )}
            </div>

            {collection.isPublic && collection.publicSlug && (
              <p className="text-xs mt-2 break-all" style={{ color: "var(--text-tertiary)" }}>
                {`${typeof window !== "undefined" ? window.location.origin : ""}${ROUTES.publicCollection(collection.publicSlug)}`}
              </p>
            )}

            {shareMessage && (
              <p className="text-xs mt-2" style={{ color: "var(--accent-500)" }}>
                {shareMessage}
              </p>
            )}
          </div>

          <div className="mb-6">
            <button
              onClick={handleDeleteCollection}
              disabled={deleteCollection.isPending}
              className="px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                background: "var(--bg-secondary)",
              }}
            >
              {deleteCollection.isPending ? "Deleting..." : "Delete Collection"}
            </button>
          </div>

          {collection.items.length === 0 ? (
            <EmptyState
              icon="collection"
              title="No items in this collection"
              description="Add items from item details or while saving new content."
              action={{ label: "Go to Dashboard", onClick: () => router.push(ROUTES.dashboard) }}
            />
          ) : (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                : "flex flex-col gap-3"
            )}>
              {collection.items.map((item) => {
                const isRemoving = removingItemId === item.id;
                return (
                  <div key={item.id} className="space-y-2">
                    <ItemCard item={item} viewMode={viewMode} />
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={isRemoving}
                      className="w-full px-3 py-2 rounded-lg text-sm border transition-colors disabled:opacity-60"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                        background: "var(--bg-secondary)",
                      }}
                    >
                      {isRemoving ? "Removing..." : "Remove from Collection"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                onClick={() => setShowEditModal(false)}
              />

              <form
                onSubmit={handleUpdateCollection}
                className="relative w-full max-w-lg p-5 rounded-xl border space-y-3"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    Edit Collection
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus-ring"
                    style={{
                      background: "var(--bg-primary)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm border focus-ring"
                    style={{
                      background: "var(--bg-primary)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={editIsPublic}
                    onChange={(e) => setEditIsPublic(e.target.checked)}
                  />
                  Public collection
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={updateCollection.isPending}
                    className="px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                      background: "var(--bg-primary)",
                    }}
                  >
                    {updateCollection.isPending ? "Saving..." : "Save Changes"}
                  </button>

                  {editMessage && (
                    <span className="text-xs" style={{ color: "var(--accent-500)" }}>
                      {editMessage}
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
