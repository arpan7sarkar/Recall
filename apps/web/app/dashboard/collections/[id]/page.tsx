"use client";

import { useEffect, useRef, useState } from "react";
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
import { Icon } from "@/components/shared/Icon";

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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  const isSharing = shareCollection.isPending || unshareCollection.isPending;

  useEffect(() => {
    if (!collection) return;
    setEditName(collection.name ?? "");
    setEditDescription(collection.description ?? "");
  }, [collection]);

  useEffect(() => {
    if (!showSettingsMenu) return;

    const handleOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showSettingsMenu]);

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
      setShareMessage("Shared link disabled.");
    } catch {
      setShareMessage("Failed to disable shared link.");
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
        className="inline-flex items-center gap-2 text-sm mb-4 underline"
        style={{ color: "var(--text-secondary)" }}
      >
        <Icon name="left" size={14} />
        Back to Collections
      </button>

      {error ? (
        <div
          className="p-8 text-center rounded-lg border"
          style={{
            color: "color-mix(in srgb, #ef4444 70%, var(--text-primary) 30%)",
            background: "color-mix(in srgb, var(--bg-secondary) 88%, #b91c1c 12%)",
            borderColor: "color-mix(in srgb, var(--border) 50%, #dc2626 50%)",
          }}
        >
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
          <section
            className="mb-8 rounded-2xl border"
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
                    Collection
                  </p>
                  <h1 className="text-3xl font-serif tracking-tight" style={{ color: "var(--text-primary)" }}>
                    {collection.name}
                  </h1>
                  <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                    {(collection.items?.length ?? 0)} items
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare(false)}
                    disabled={isSharing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border disabled:opacity-60"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                      background: "color-mix(in srgb, var(--bg-primary) 84%, black 16%)",
                    }}
                  >
                    <span>Share via Link</span>
                    <Icon name="link" size={15} />
                  </button>

                  <div className="relative" ref={settingsMenuRef}>
                    <button
                      onClick={() => setShowSettingsMenu((prev) => !prev)}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl border"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                        background: "color-mix(in srgb, var(--bg-primary) 84%, black 16%)",
                      }}
                      aria-label="Collection settings"
                    >
                      <Icon name="settings" size={16} />
                    </button>

                    {showSettingsMenu && (
                      <div
                        className="absolute right-0 top-full mt-2 w-44 rounded-xl border py-1 z-20"
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--bg-secondary)",
                          boxShadow: "var(--shadow-card)",
                        }}
                      >
                        {collection.isPublic && collection.publicSlug && (
                          <button
                            onClick={() => {
                              setShowSettingsMenu(false);
                              handleShare(true);
                            }}
                            className="w-full text-left px-3 py-2 text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Regenerate link
                          </button>
                        )}
                        {collection.isPublic && (
                          <button
                            onClick={() => {
                              setShowSettingsMenu(false);
                              handleUnshare();
                            }}
                            className="w-full text-left px-3 py-2 text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Disable shared link
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditMessage(null);
                            setShowEditModal(true);
                            setShowSettingsMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Edit collection
                        </button>
                        <button
                          onClick={() => {
                            setShowSettingsMenu(false);
                            handleDeleteCollection();
                          }}
                          className="w-full text-left px-3 py-2 text-sm border-t"
                          style={{ color: "var(--danger, #ef4444)", borderColor: "var(--border)" }}
                        >
                          Delete collection
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {collection.description && (
                <p className="relative text-sm mt-3 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
                  {collection.description}
                </p>
              )}

              {collection.isPublic && collection.publicSlug && (
                <p className="relative text-xs mt-2 break-all" style={{ color: "var(--text-tertiary)" }}>
                  {`${typeof window !== "undefined" ? window.location.origin : ""}${ROUTES.publicCollection(collection.publicSlug)}`}
                </p>
              )}

              {shareMessage && (
                <p className="relative text-xs mt-2" style={{ color: "var(--accent-500)" }}>
                  {shareMessage}
                </p>
              )}
            </div>
          </section>

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
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
