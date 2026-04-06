"use client";

import { useRouter } from "next/navigation";
import type { Item } from "@/types";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { timeAgo, extractDomain } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/Icon";
import { Heart } from "lucide-react";
import Script from "next/script";
import { LoaderOne } from "@/components/ui/unique-loader-components";
import { SocialPostPreview } from "@/components/items/SocialPostPreview";
import { InstagramAutoEmbed } from "@/components/items/InstagramAutoEmbed";
import { useArchiveItem, useUnarchiveItem } from "@/hooks/useItems";

interface ItemCardProps {
  item: Item;
  viewMode?: "grid" | "list";
}

export function ItemCard({ item, viewMode = "grid" }: ItemCardProps) {
  const router = useRouter();
  const archiveItem = useArchiveItem();
  const unarchiveItem = useUnarchiveItem();
  const isProcessing = item.status === "processing" || item.status === "pending";
  const isInstagram = item.itemType === "instagram";
  const isStaticSocialPreview = item.itemType === "linkedin";
  const trimmedTitle = (item.title || "").trim();
  const shouldShowTitle = !isInstagram || trimmedTitle.length > 0;
  const isArchiveUpdating = archiveItem.isPending || unarchiveItem.isPending;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button, blockquote")) return;
    router.push(ROUTES.item(item.id));
  };

  const handleArchiveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (item.isArchived) {
        await unarchiveItem.mutateAsync(item.id);
      } else {
        await archiveItem.mutateAsync(item.id);
      }
    } catch (err) {
      console.error("Failed to toggle archive state:", err);
    }
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={handleCardClick}
        className="flex items-center gap-4 p-6 cursor-pointer transition-all duration-500 border rounded-xl bg-card/60 backdrop-blur-sm border-border hover:border-accent/30 hover:bg-zinc-900/40 group/list"
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
          <p className="text-[10px] font-serif italic text-zinc-500 mt-1.5 group-hover/list:text-zinc-400 transition-colors">
            {extractDomain(item.url)} <span className="mx-1 opacity-30">|</span> {timeAgo(item.savedAt)}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleArchiveToggle}
            disabled={isArchiveUpdating}
            className="text-[10px] px-2 py-1 rounded-md border transition-colors disabled:opacity-60"
            style={{
              color: "var(--text-secondary)",
              borderColor: "var(--border)",
              background: "var(--bg-secondary)",
            }}
          >
            {isArchiveUpdating ? "..." : item.isArchived ? "Unarchive" : "Archive"}
          </button>

          {item.isFavourite && (
            <div className="flex items-center justify-center shrink-0" style={{ color: "var(--accent-500)" }}>
              <Heart size={14} fill="currentColor" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
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
          <div className="w-full flex justify-center pointer-events-auto">
            <blockquote className="twitter-tweet" data-conversation="none" data-theme="dark" data-align="center">
              <a href={(item.url || "").replace("x.com", "twitter.com")} target="_blank"></a>
            </blockquote>
            <Script
              src="https://platform.twitter.com/widgets.js"
              strategy="afterInteractive"
              onLoad={() => {
                // @ts-ignore
                if (window.twttr) window.twttr.widgets.load();
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

        {item.isFavourite && (
          <div
            className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full text-xs border border-white/5 bg-(--bg-elevated)/60 backdrop-blur-md"
            style={{ width: 32, height: 32, color: "var(--accent-500)" }}
          >
            <Heart size={16} fill="currentColor" />
          </div>
        )}

        <button
          onClick={handleArchiveToggle}
          disabled={isArchiveUpdating}
          className="absolute top-4 left-4 z-10 flex items-center justify-center rounded-full text-xs border border-white/5 bg-(--bg-elevated)/60 backdrop-blur-md disabled:opacity-60"
          style={{ width: 32, height: 32, color: "var(--text-secondary)" }}
          aria-label={item.isArchived ? "Unarchive item" : "Archive item"}
        >
          <Icon name="archive" size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-2 p-5 flex-1 relative">
        <div className="absolute inset-x-0 bottom-0 top-0 bg-linear-to-tl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground relative z-10">
          <TypeBadge type={item.itemType} size="sm" />
          <span>{timeAgo(item.savedAt)}</span>
        </div>

        {shouldShowTitle && (
          <h3 className="text-lg font-serif italic text-white/90 tracking-tight line-clamp-2 mt-1 relative z-10 group-hover:text-accent transition-colors duration-500">
            {trimmedTitle || "Untitled"}
          </h3>
        )}

        {item.description && item.itemType !== "tweet" && (
          <p className="text-xs font-serif italic text-zinc-500 line-clamp-3 mt-2 relative z-10 leading-relaxed group-hover:text-zinc-400 transition-colors duration-500">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
