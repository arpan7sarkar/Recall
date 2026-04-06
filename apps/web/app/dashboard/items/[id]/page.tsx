"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useItem, useArchiveItem, useDeleteItem, useUnarchiveItem } from "@/hooks/useItems";
import { useCollections, useAddItemToCollection, useCreateCollection } from "@/hooks/useCollections";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { TagChip } from "@/components/shared/TagChip";
import { timeAgo, extractDomain, formatReadingTime } from "@/lib/utils";
import { RelatedItems } from "@/components/items/RelatedItems";
import { Icon } from "@/components/shared/Icon";
import { TweetPreview } from "@/components/items/TweetPreview";
import { SocialPostPreview } from "@/components/items/SocialPostPreview";
import { InstagramAutoEmbed } from "@/components/items/InstagramAutoEmbed";
import { LoaderFive, LoaderTwo } from "@/components/ui/unique-loader-components";
import { Trash2 } from "lucide-react";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const { data: item, isLoading, error } = useItem(id as string);
  const archiveItem = useArchiveItem();
  const unarchiveItem = useUnarchiveItem();
  const deleteItem = useDeleteItem();
  const { data: collections } = useCollections();
  const addItemToCollection = useAddItemToCollection();
  const createCollection = useCreateCollection();

  const [showCreateCollectionForm, setShowCreateCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [collectionError, setCollectionError] = useState<string | null>(null);

  const isArchiving = archiveItem.isPending || unarchiveItem.isPending;
  const isDeleting = deleteItem.isPending;

  const handleArchive = async () => {
    if (!item) return;
    try {
      if (item.isArchived) {
        await unarchiveItem.mutateAsync(item.id);
      } else {
        await archiveItem.mutateAsync(item.id);
      }
    } catch (e) {
      console.error("Failed to archive item", e);
    }
  };

  const handleAddToCollection = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const collectionId = e.target.value;
    if (!item || !collectionId) return;

    if (collectionId === "__new_collection__") {
      setShowCreateCollectionForm(true);
      e.target.value = "";
      return;
    }

    try {
      await addItemToCollection.mutateAsync({ collectionId, itemId: item.id });
      // clear select value after success
      e.target.value = "";
    } catch (e) {
      console.error("Failed to add to collection", e);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    const confirmed = window.confirm("Delete this item permanently? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteItem.mutateAsync(item.id);
      router.push("/dashboard");
    } catch (e) {
      console.error("Failed to delete item", e);
    }
  };

  const handleCreateCollectionAndAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!item) return;

    const normalizedName = newCollectionName.trim();
    if (!normalizedName) {
      setCollectionError("Collection name is required.");
      return;
    }

    try {
      setCollectionError(null);
      const created = await createCollection.mutateAsync({
        name: normalizedName,
        description: newCollectionDescription.trim() || undefined,
      });
      await addItemToCollection.mutateAsync({ collectionId: created.id, itemId: item.id });
      setNewCollectionName("");
      setNewCollectionDescription("");
      setShowCreateCollectionForm(false);
    } catch (err: unknown) {
      const apiError =
        typeof err === "object" && err !== null && "body" in err
          ? (err as { body?: { error?: string } }).body?.error
          : undefined;
      setCollectionError(apiError ?? "Failed to create collection.");
    }
  };
  const isInstagram = item?.itemType === "instagram";
  const isStaticSocialPreview = item?.itemType === "linkedin";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
        <LoaderFive text="Loading your content" />
        <div className="mt-4 opacity-50">
          <LoaderTwo />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          {error ? "Failed to load item" : "Item not found"}
        </h2>
        <button
          onClick={() => router.back()}
          className="text-sm underline"
          style={{ color: "var(--accent-500)" }}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold mb-6 focus-ring group"
        style={{ color: "var(--text-secondary)" }}
      >
        <Icon name="left" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Left column — content */}
        <div>
          {/* Showcase: Specialized rendering by type */}
          {item.itemType === "tweet" ? (
            <div className="mb-8">
              <TweetPreview item={item} />
            </div>
          ) : isInstagram ? (
            <div className="mb-8">
              <InstagramAutoEmbed item={item} className="h-[420px]" />
            </div>
          ) : isStaticSocialPreview ? (
            <div className="mb-8">
              <SocialPostPreview item={item} className="h-[280px]" />
            </div>
          ) : (
            <div
              className="flex items-center justify-center rounded-xl mb-6 shadow-sm overflow-hidden"
              style={{
                height: 240,
                background: item.thumbnailUrl
                  ? `url(${item.thumbnailUrl}) center/cover`
                  : "linear-gradient(135deg, var(--accent-50), var(--bg-tertiary))",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
              }}
            >
              {!item.thumbnailUrl && (
                <div className="opacity-20 translate-y-3">
                  <Icon name={item.itemType} size={84} />
                </div>
              )}
            </div>
          )}

          {/* Type + Domain */}
          <div className="flex items-center gap-3 mb-3">
            <TypeBadge type={item.itemType} size="md" />
            {item.sourceDomain && (
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                {item.sourceDomain}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            {item.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm" style={{ color: "var(--text-tertiary)" }}>
            {item.author && <span>By {item.author}</span>}
            {item.readingTime && <span>· {formatReadingTime(item.readingTime)}</span>}
            <span>· Saved {timeAgo(item.savedAt)}</span>
            <span>· {item.viewCount} views</span>
          </div>

          {/* Content Body */}
          {(item.description || item.contentText) && (
            <div
              className="p-6 rounded-2xl mb-8 space-y-4"
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--border)",
              }}
            >
              <h3 className="text-sm font-bold uppercase tracking-tight opacity-40">Main Content</h3>
              {item.description && (
                <p className="text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {item.description}
                </p>
              )}
              {item.contentText && item.itemType !== "tweet" && (
                <div 
                  className="text-sm leading-relaxed whitespace-pre-wrap pt-4 border-t opacity-80" 
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
                >
                  {item.contentText}
                </div>
              )}
            </div>
          )}

          {/* User note */}
          {item.userNote && (
            <div
              className="p-4 rounded-xl mb-6"
              style={{
                background: "var(--warm-100)",
                borderRadius: "var(--radius-md)",
                borderLeft: "3px solid var(--warm-500)",
              }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Your note</p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{item.userNote}</p>
            </div>
          )}

          {/* File preview for PDFs */}
          {item.fileUrl && item.itemType === "pdf" && (
            <div
              className="rounded-xl overflow-hidden mb-6"
              style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}
            >
              <div className="p-4 flex items-center justify-between" style={{ background: "var(--bg-tertiary)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>PDF Document</span>
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary focus-ring inline-flex rounded-lg px-3 py-1.5 text-xs font-medium"
                >
                  Open File
                </a>
              </div>
            </div>
          )}

          {/* Related items */}
          <RelatedItems itemId={id as string} />
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-5">
          {/* Actions */}
          <div
            className="p-4 rounded-xl space-y-3"
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 focus-ring shadow-sm"
                style={{
                  background: item.isFavourite ? "var(--button-primary-bg)" : "var(--bg-tertiary)",
                  color: item.isFavourite ? "var(--button-primary-text)" : "var(--text-secondary)",
                  border: item.isFavourite ? "1px solid var(--button-primary-border)" : "1px solid var(--border)",
                }}
              >
                <Icon name={item.isFavourite ? "check" : "plus"} size={16} />
                {item.isFavourite ? "Saved" : "Save to Favorites"}
              </button>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border shadow-sm focus-ring"
                  style={{
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                >
                  <Icon name="external" size={16} />
                  Open Original
                </a>
              )}
              <button
                onClick={handleArchive}
                disabled={isArchiving || isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border shadow-sm focus-ring"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-secondary)",
                  borderColor: "var(--border)",
                  opacity: isArchiving || isDeleting ? 0.6 : 1,
                }}
              >
                <Icon name="archive" size={16} />
                {isArchiving ? "Updating..." : item.isArchived ? "Unarchive" : "Archive"}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || isArchiving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border shadow-sm focus-ring"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--danger, #ef4444)",
                  borderColor: "var(--border)",
                  opacity: isDeleting || isArchiving ? 0.6 : 1,
                }}
              >
                <Trash2 size={16} />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>

            <div className="pt-4 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Save to Collection
              </h4>
              <select
                onChange={handleAddToCollection}
                disabled={addItemToCollection.isPending}
                className="w-full px-3 py-2 text-sm rounded-lg border shadow-sm focus-ring"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  opacity: addItemToCollection.isPending ? 0.5 : 1,
                }}
              >
                <option value="">Select a collection...</option>
                <option value="__new_collection__">+ Create new collection</option>
                {collections?.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>

              {showCreateCollectionForm && (
                <form onSubmit={handleCreateCollectionAndAdd} className="mt-3 space-y-2">
                  <input
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                    className="w-full px-3 py-2 text-sm rounded-lg border shadow-sm focus-ring"
                    style={{
                      background: "var(--bg-primary)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <input
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 text-sm rounded-lg border shadow-sm focus-ring"
                    style={{
                      background: "var(--bg-primary)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />

                  {collectionError && (
                    <p className="text-xs text-red-500">{collectionError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createCollection.isPending || addItemToCollection.isPending}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold border focus-ring"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        opacity: createCollection.isPending || addItemToCollection.isPending ? 0.6 : 1,
                      }}
                    >
                      {createCollection.isPending ? "Creating..." : "Create & Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateCollectionForm(false)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold border focus-ring"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-primary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>




          {/* Tags */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
              Tags
            </h3>
            {item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <TagChip
                    key={tag.tagId}
                    name={tag.tagName}
                    color={tag.tagColor}
                    isAiGenerated={tag.isAiGenerated}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                No tags yet
              </p>
            )}
          </div>

          {/* Info */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
              Details
            </h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt style={{ color: "var(--text-tertiary)" }}>Source</dt>
                <dd style={{ color: "var(--text-primary)" }}>{item.saveSource.replace("_", " ")}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: "var(--text-tertiary)" }}>Status</dt>
                <dd style={{ color: item.status === "ready" ? "var(--success)" : "var(--warning)" }}>
                  {item.status}
                </dd>
              </div>
              {item.wordCount && (
                <div className="flex justify-between">
                  <dt style={{ color: "var(--text-tertiary)" }}>Words</dt>
                  <dd style={{ color: "var(--text-primary)" }}>{item.wordCount.toLocaleString()}</dd>
                </div>
              )}
              {item.url && (
                <div>
                  <dt className="mb-1" style={{ color: "var(--text-tertiary)" }}>URL</dt>
                  <dd className="truncate" style={{ color: "var(--accent-500)" }}>
                    {extractDomain(item.url)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
