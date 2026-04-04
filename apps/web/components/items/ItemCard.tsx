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
  const isFailed = item.status === "failed";

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking an interactive element like a tweet link or heart
    if ((e.target as HTMLElement).closest("a, button, blockquote")) return;
    router.push(ROUTES.item(item.id));
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={handleCardClick}
        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer card-hover focus-ring"
        style={{
          background: "var(--bg-secondary)",
          boxShadow: "var(--shadow-card)",
          borderRadius: "var(--radius-lg)",
        }}
        id={`item-card-${item.id}`}
      >
        {/* ... existing thumbnail logic ... */}
        <div
          className="flex items-center justify-center shrink-0 rounded-lg text-2xl"
          style={{
            width: 56,
            height: 56,
            background: `linear-gradient(135deg, var(--accent-50), var(--bg-tertiary))`,
            borderRadius: "var(--radius-md)",
          }}
        >
          {isProcessing ? (
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
          ) : (
            <TypeBadge type={item.itemType} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {item.title || "Untitled"}
          </h3>
          <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {extractDomain(item.url)} · {timeAgo(item.savedAt)}
          </p>
        </div>

        {/* Favourite */}
        {item.isFavourite && (
          <div className="flex items-center justify-center shrink-0" style={{ color: "var(--accent-500)" }}>
             <Heart size={14} fill="currentColor" />
          </div>
        )}
      </div>
    );
  }

  // Grid mode
  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col rounded-xl overflow-hidden cursor-pointer card-hover focus-ring"
      style={{
        background: "var(--bg-secondary)",
        boxShadow: "var(--shadow-card)",
        borderRadius: "var(--radius-lg)",
        height: "100%",
      }}
      id={`item-card-${item.id}`}
    >
      {/* Thumbnail / Showcase */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          !item.thumbnailUrl && item.itemType !== "tweet" && "bg-gradient-to-br from-slate-50 to-slate-100",
          isProcessing && "skeleton"
        )}
        style={{
          minHeight: 180,
          background: item.thumbnailUrl
            ? `url(${item.thumbnailUrl}) center/cover`
            : undefined,
        }}
      >
        {item.itemType === "tweet" && !isProcessing ? (
          <div className="w-full flex justify-center py-2 pointer-events-auto">
            <blockquote className="twitter-tweet" data-conversation="none" data-cards="hidden" data-media-max-width="400">
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
          <div className="absolute top-3 right-3 z-10 flex items-center justify-center rounded-full text-xs shadow-sm bg-white/90 backdrop-blur-sm" style={{ width: 32, height: 32, color: "var(--accent-500)" }}>
            <Heart size={16} fill="currentColor" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          <TypeBadge type={item.itemType} size="sm" />
          <span>{timeAgo(item.savedAt)}</span>
        </div>

        <h3 className="text-sm font-bold leading-tight line-clamp-2" style={{ color: "var(--text-primary)" }}>
          {item.title || "Untitled"}
        </h3>
        
        {item.description && item.itemType !== "tweet" && (
          <p className="text-xs line-clamp-3 opacity-70" style={{ color: "var(--text-secondary)" }}>
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
  
