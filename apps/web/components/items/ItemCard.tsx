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
        className="flex items-center gap-4 p-5 cursor-pointer card-hover focus-ring backdrop-blur-md border"
        style={{
          background: "var(--bg-secondary)",
          boxShadow: "var(--shadow-card)",
          borderColor: "var(--border)",
        }}
        id={`item-card-${item.id}`}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 48,
            height: 48,
            background: "var(--bg-tertiary)",
          }}
        >
          {isProcessing ? (
            <div className="skeleton" style={{ width: 24, height: 24 }} />
          ) : (
            <TypeBadge type={item.itemType} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[11px] font-black uppercase tracking-[0.1em] truncate" style={{ color: "var(--text-primary)" }}>
            {item.title || "Untitled"}
          </h3>
          <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-50" style={{ color: "var(--text-tertiary)" }}>
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
      className="flex flex-col overflow-hidden cursor-pointer card-hover focus-ring backdrop-blur-md border"
      style={{
        background: "var(--bg-secondary)",
        boxShadow: "var(--shadow-card)",
        borderColor: "var(--border)",
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
  
