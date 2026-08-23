"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Item } from "@/types";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { timeAgo, extractDomain } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/Icon";
import { Heart, Trash2 } from "lucide-react";
import Script from "next/script";
import { LoaderOne } from "@/components/ui/unique-loader-components";
import { SocialPostPreview } from "@/components/items/SocialPostPreview";
import { InstagramAutoEmbed } from "@/components/items/InstagramAutoEmbed";
import {
  useArchiveItem,
  useDeleteItem,
  useRetryItem,
  useToggleFavorite,
  useUnarchiveItem,
} from "@/hooks/useItems";
import {
  loadTwitterWidgets,
  TWITTER_WIDGET_SCRIPT_ID,
  TWITTER_WIDGET_SCRIPT_SRC,
} from "@/lib/twitterWidgets";

interface ItemCardProps {
  item: Item;
  viewMode?: "grid" | "list";
}

export function ItemCard({ item, viewMode = "grid" }: ItemCardProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const archiveItem = useArchiveItem();
  const unarchiveItem = useUnarchiveItem();
  const deleteItem = useDeleteItem();
  const toggleFavorite = useToggleFavorite();
  const retryItem = useRetryItem();
  const tweetContainerRef = useRef<HTMLDivElement>(null);
  const isProcessing = item.status === "processing" || item.status === "pending";
  const isInstagram = item.itemType === "instagram";
  const isStaticSocialPreview = item.itemType === "linkedin";
  const trimmedTitle = (item.title || "").trim();
  const shouldShowTitle = !isInstagram || trimmedTitle.length > 0;
  const isArchiveUpdating = archiveItem.isPending || unarchiveItem.isPending;
  const isDeletePending = deleteItem.isPending;
  const isFavoriteUpdating = toggleFavorite.isPending;
  const isRetrying = retryItem.isPending;

  const clearActionError = () => setActionError(null);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button, blockquote")) return;
    router.push(ROUTES.item(item.id));
  };

  const handleArchiveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    clearActionError();

    try {
      if (item.isArchived) {
        await unarchiveItem.mutateAsync(item.id);
      } else {
        await archiveItem.mutateAsync(item.id);
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Archive update failed. Please try again."));
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    clearActionError();

    try {
      await toggleFavorite.mutateAsync({ id: item.id, isFavourite: !item.isFavourite });
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Favorite update failed. Please try again."));
    }
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    clearActionError();
    setRetryNotice(null);

    try {
      await retryItem.mutateAsync(item.id);
      setRetryNotice("Retry queued. This item will update when processing resumes.");
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Retry could not be queued. Check the worker and try again."));
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    clearActionError();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteItem.mutateAsync(item.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Delete failed. Please try again."));
    }
  };

  const favoriteLabel = item.isFavourite ? "Remove from favorites" : "Add to favorites";
  const failureReason = item.processingError?.trim() || "Processing stopped before this item was ready.";
  const recoveryMessage = actionError ? (
    <p
      role={item.status === "failed" ? undefined : "alert"}
      className="mt-2 rounded-lg border px-3 py-2 text-xs"
      style={{
        color: "var(--danger-foreground)",
        borderColor: "var(--danger-border)",
        background: "var(--danger-bg)",
      }}
    >
      {actionError}
    </p>
  ) : null;
  const failureState = item.status === "failed" ? (
    <div
      role="alert"
      className="relative z-10 mt-3 rounded-xl border px-3 py-3"
      style={{
        borderColor: "var(--danger-border)",
        background: "var(--danger-bg)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium" style={{ color: "var(--danger-foreground)" }}>
          Processing failed
        </p>
        <button
          onClick={handleRetry}
          disabled={isRetrying || isDeletePending || isArchiveUpdating}
          className="rounded-md border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-60"
          style={{ color: "var(--text-primary)", borderColor: "var(--border)", background: "var(--bg-primary)" }}
          aria-label="Retry processing"
        >
          {isRetrying ? "Retrying..." : "Retry"}
        </button>
      </div>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {failureReason}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        Stage: {item.processingStage || "processing"}
      </p>
      {retryNotice && (
        <p role="status" className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          {retryNotice}
        </p>
      )}
      {recoveryMessage}
    </div>
  ) : recoveryMessage;

  const deleteConfirmPopup = showDeleteConfirm ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
      <div
        className="relative w-full max-w-sm rounded-2xl border p-5 space-y-4"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-secondary)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Delete this item?
          </h3>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            This action cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-3 py-2 rounded-lg text-sm border"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              background: "var(--bg-primary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeletePending}
            className="px-3 py-2 rounded-lg text-sm border disabled:opacity-60"
            style={{
              borderColor: "var(--danger-border)",
              color: "var(--button-primary-text)",
              background: "var(--danger)",
            }}
          >
            {isDeletePending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (viewMode === "list") {
    return (
      <>
        <div
          onClick={handleCardClick}
          className="flex items-center gap-4 p-6 cursor-pointer transition-all duration-500 border rounded-xl bg-card/60 backdrop-blur-sm border-border hover:border-accent/30 hover:bg-(--bg-tertiary) group/list"
          id={`item-card-${item.id}`}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 48,
              height: 48,
            }}
          >
            {isProcessing ? (
              <div className="scale-75 flex items-center justify-center">
                <LoaderOne />
              </div>
            ) : (
              <TypeBadge type={item.itemType} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {shouldShowTitle && (
              <h3 className="text-sm font-serif text-(--text-primary) tracking-tight truncate">
                {trimmedTitle || "Untitled"}
              </h3>
            )}
            <p className="text-[10px] font-serif italic text-(--text-tertiary) mt-1.5 group-hover/list:text-(--text-secondary) transition-colors">
              {extractDomain(item.url)} <span className="mx-1 opacity-30">|</span> {timeAgo(item.savedAt)}
            </p>
            {failureState}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleArchiveToggle}
              disabled={isArchiveUpdating || isDeletePending}
              className="text-[10px] px-2 py-1 rounded-md border transition-colors disabled:opacity-60"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
              }}
            >
              {isArchiveUpdating ? "..." : item.isArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeletePending}
              className="text-[10px] px-2 py-1 rounded-md border transition-colors disabled:opacity-60"
              style={{
                color: "var(--danger)",
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
              }}
            >
              {isDeletePending ? "Deleting..." : "Delete"}
            </button>

            <button
              onClick={handleFavoriteToggle}
              disabled={isFavoriteUpdating || isDeletePending || isArchiveUpdating}
              className="flex items-center justify-center shrink-0 rounded-md p-1 transition-colors disabled:opacity-60"
              style={{ color: item.isFavourite ? "var(--accent-500)" : "var(--text-tertiary)" }}
              aria-label={favoriteLabel}
              title={favoriteLabel}
            >
              <Heart size={14} fill={item.isFavourite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {deleteConfirmPopup}
      </>
    );
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className="flex flex-col overflow-hidden cursor-pointer transition-all duration-700 border rounded-2xl bg-card/40 backdrop-blur-md border-border hover:border-accent/40 group min-h-[420px] h-full"
        id={`item-card-${item.id}`}
      >
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden bg-(--bg-primary)/40 border-b border-border transition-all duration-500",
            item.itemType === "tweet" ? "h-auto min-h-48 p-4" : isInstagram || isStaticSocialPreview ? "h-56 p-0" : "h-48",
            !item.thumbnailUrl && item.itemType !== "tweet" && !isInstagram && !isStaticSocialPreview && "bg-linear-to-br from-indigo-500/5 to-transparent",
            isProcessing && "bg-muted animate-pulse"
          )}
          style={{
            background: item.thumbnailUrl && !isInstagram && !isStaticSocialPreview ? `url(${item.thumbnailUrl}) center/cover` : undefined,
          }}
        >
        {item.itemType === "tweet" && !isProcessing ? (
          <div ref={tweetContainerRef} className="w-full flex justify-center pointer-events-auto">
            <blockquote className="twitter-tweet" data-conversation="none" data-theme="dark" data-align="center">
              <a href={(item.url || "").replace("x.com", "twitter.com")} target="_blank"></a>
            </blockquote>
            <Script
              id={TWITTER_WIDGET_SCRIPT_ID}
              src={TWITTER_WIDGET_SCRIPT_SRC}
              strategy="afterInteractive"
              onLoad={() => {
                loadTwitterWidgets(tweetContainerRef.current);
              }}
              onReady={() => {
                loadTwitterWidgets(tweetContainerRef.current);
              }}
            />
          </div>
        ) : isInstagram && !isProcessing ? (
          <div className="h-full w-full p-3 pointer-events-auto">
            <InstagramAutoEmbed item={item} compact className="h-full" />
          </div>
        ) : isStaticSocialPreview && !isProcessing ? (
          <div className="h-full w-full p-3 pointer-events-auto">
            <SocialPostPreview item={item} compact className="h-full border-0 rounded-lg" />
          </div>
        ) : !item.thumbnailUrl && !isProcessing ? (
          <div className="opacity-10">
            <Icon name={item.itemType} size={84} />
          </div>
        ) : null}

        <button
          onClick={handleFavoriteToggle}
          disabled={isFavoriteUpdating || isDeletePending || isArchiveUpdating}
          className="absolute top-4 right-14 z-10 flex items-center justify-center rounded-full text-xs border bg-(--bg-elevated)/60 backdrop-blur-md disabled:opacity-60"
          style={{ width: 32, height: 32, borderColor: "var(--border)", color: item.isFavourite ? "var(--accent-500)" : "var(--text-secondary)" }}
          aria-label={favoriteLabel}
          title={favoriteLabel}
        >
          <Heart size={16} fill={item.isFavourite ? "currentColor" : "none"} />
        </button>

        <button
          onClick={handleArchiveToggle}
          disabled={isArchiveUpdating || isDeletePending}
          className="absolute top-4 left-4 z-10 flex items-center justify-center rounded-full text-xs border bg-(--bg-elevated)/60 backdrop-blur-md disabled:opacity-60"
          style={{ width: 32, height: 32, borderColor: "var(--border)", color: "var(--text-secondary)" }}
          aria-label={item.isArchived ? "Unarchive item" : "Archive item"}
        >
          <Icon name="archive" size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeletePending || isArchiveUpdating}
          className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full text-xs border bg-(--bg-elevated)/60 backdrop-blur-md disabled:opacity-60"
          style={{ width: 32, height: 32, borderColor: "var(--border)", color: "var(--danger)" }}
          aria-label="Delete item"
        >
          <Trash2 size={14} />
        </button>
        </div>

        <div className="flex flex-col gap-2 p-5 flex-1 relative">
          <div className="absolute inset-x-0 bottom-0 top-0 bg-linear-to-tl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground relative z-10">
            <TypeBadge type={item.itemType} size="sm" />
            <span>{timeAgo(item.savedAt)}</span>
          </div>

          {shouldShowTitle && (
            <h3 className="text-lg font-serif italic text-(--text-primary) tracking-tight line-clamp-2 mt-1 relative z-10 group-hover:text-accent transition-colors duration-500">
              {trimmedTitle || "Untitled"}
            </h3>
          )}

          {item.description && item.itemType !== "tweet" && (
            <p className="text-xs font-serif italic text-(--text-tertiary) line-clamp-3 mt-2 relative z-10 leading-relaxed group-hover:text-(--text-secondary) transition-colors duration-500">
              {item.description}
            </p>
          )}

          {failureState}
        </div>
      </div>
      {deleteConfirmPopup}
    </>
  );
}
