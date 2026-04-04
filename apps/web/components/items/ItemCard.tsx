"use client";

import { useRouter } from "next/navigation";
import type { Item } from "@/types";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { TagChip } from "@/components/shared/TagChip";
import { timeAgo, extractDomain, truncate, formatReadingTime } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/Icon";
import { Heart } from "lucide-react";
import Script from "next/script";

interface ItemCardProps {
  item: Item;
  viewMode?: "grid" | "list";
}

export function ItemCard({ item, viewMode = "grid" }: ItemCardProps) {
  const router = useRouter();
  const isProcessing = item.status === "processing" || item.status === "pending";

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button, blockquote")) return;
    router.push(ROUTES.item(item.id));
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={handleCardClick}
        className="flex items-center gap-4 p-5 cursor-pointer transition-all duration-300 border rounded-xl bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)] shadow-sm"
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
            <div className="skeleton" style={{ width: 24, height: 24 }} />
          ) : (
            <TypeBadge type={item.itemType} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-serif text-[var(--text-primary)] tracking-tight truncate">
            {item.title || "Untitled"}
          </h3>
          <p className="text-[10px] font-light text-[var(--text-secondary)] mt-1">
            {extractDomain(item.url)} · {timeAgo(item.savedAt)}
          </p>
        </div>

        {item.isFavourite && (
          <div className="flex items-center justify-center shrink-0" style={{ color: "var(--accent-500)" }}>
             <Heart size={14} fill="currentColor" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col overflow-hidden cursor-pointer transition-all duration-300 border rounded-2xl bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--border-hover)] shadow-sm group min-h-[400px] h-full"
      id={`item-card-${item.id}`}
    >
      {/* Thumbnail / Showcase */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-[var(--bg-primary)]/40 border-b border-[var(--border)] transition-all duration-500",
          item.itemType === "tweet" ? "h-auto min-h-48 p-4" : "h-48",
          !item.thumbnailUrl && item.itemType !== "tweet" && "bg-linear-to-br from-indigo-500/5 to-transparent",
          isProcessing && "skeleton"
        )}
        style={{
          background: item.thumbnailUrl
            ? `url(${item.thumbnailUrl}) center/cover`
            : undefined,
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
        ) : !item.thumbnailUrl && !isProcessing ? (
          <div className="opacity-10">
            <Icon name={item.itemType} size={84} />
          </div>
        ) : null}

        {/* ... overlay logic ... */}
        {item.isFavourite && (
          <div className="absolute top-3 right-3 z-10 flex items-center justify-center rounded-full text-xs shadow-sm bg-[var(--bg-elevated)]/90 backdrop-blur-sm" style={{ width: 32, height: 32, color: "var(--accent-500)" }}>
            <Heart size={16} fill="currentColor" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-5 flex-1 relative">
        <div className="absolute inset-x-0 bottom-0 top-0 bg-linear-to-tl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] relative z-10">
          <TypeBadge type={item.itemType} size="sm" />
          <span>{timeAgo(item.savedAt)}</span>
        </div>

        <h3 className="text-base font-serif text-[var(--text-primary)] tracking-tight line-clamp-2 mt-1 relative z-10 group-hover:text-indigo-400 transition-colors duration-300">
          {item.title || "Untitled"}
        </h3>
        
        {item.description && item.itemType !== "tweet" && (
          <p className="text-xs font-light text-[var(--text-secondary)] line-clamp-2 mt-1 relative z-10 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
  
