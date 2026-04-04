"use client";

import Link from "next/link";
import type { Item } from "@/types";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { TagChip } from "@/components/shared/TagChip";
import { timeAgo, extractDomain, truncate, formatReadingTime } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: Item;
  viewMode?: "grid" | "list";
}

export function ItemCard({ item, viewMode = "grid" }: ItemCardProps) {
  const isProcessing = item.status === "processing" || item.status === "pending";
  const isFailed = item.status === "failed";

  if (viewMode === "list") {
    return (
      <Link
        href={ROUTES.item(item.id)}
        className="flex items-center gap-4 p-4 rounded-xl card-hover focus-ring"
        style={{
          background: "var(--bg-secondary)",
          boxShadow: "var(--shadow-card)",
          borderRadius: "var(--radius-lg)",
        }}
        id={`item-card-${item.id}`}
      >
        {/* Thumbnail placeholder */}
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
            {item.readingTime ? ` · ${formatReadingTime(item.readingTime)}` : ""}
          </p>
        </div>

        {/* Tags */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          {item.tags.slice(0, 2).map((tag) => (
            <TagChip key={tag.tagId} name={tag.tagName} color={tag.tagColor} isAiGenerated={tag.isAiGenerated} />
          ))}
        </div>

        {/* Favourite */}
        {item.isFavourite && (
          <span className="text-sm shrink-0" title="Favourited">♥</span>
        )}
      </Link>
    );
  }

  // Grid mode
  return (
    <Link
      href={ROUTES.item(item.id)}
      className="flex flex-col rounded-xl overflow-hidden card-hover focus-ring"
      style={{
        background: "var(--bg-secondary)",
        boxShadow: "var(--shadow-card)",
        borderRadius: "var(--radius-lg)",
      }}
      id={`item-card-${item.id}`}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          isProcessing && "skeleton"
        )}
        style={{
          height: 160,
          background: item.thumbnailUrl
            ? `url(${item.thumbnailUrl}) center/cover`
            : `linear-gradient(135deg, var(--accent-50) 0%, var(--bg-tertiary) 100%)`,
        }}
      >
        {!item.thumbnailUrl && !isProcessing && (
          <span className="text-4xl opacity-30">
            {item.itemType === "article" ? "📄" : item.itemType === "youtube" ? "▶️" : item.itemType === "tweet" ? "🐦" : item.itemType === "pdf" ? "📁" : item.itemType === "podcast" ? "🎙️" : item.itemType === "image" ? "🖼️" : "🔗"}
          </span>
        )}

        {/* Favourite indicator */}
        {item.isFavourite && (
          <div
            className="absolute top-3 right-3 flex items-center justify-center rounded-full text-xs"
            style={{
              width: 28,
              height: 28,
              background: "hsla(0, 0%, 100%, 0.9)",
              backdropFilter: "blur(4px)",
            }}
          >
            ♥
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-secondary)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              Processing…
            </span>
          </div>
        )}
        {isFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "hsl(0, 70%, 96%)",
                color: "hsl(0, 60%, 42%)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              Failed
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        {/* Type + domain */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          <TypeBadge type={item.itemType} size="sm" />
          {item.sourceDomain && (
            <>
              <span>·</span>
              <span>{item.sourceDomain}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
          {truncate(item.title || "Untitled", 72)}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {truncate(item.description, 100)}
          </p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {item.tags.slice(0, 3).map((tag) => (
              <TagChip
                key={tag.tagId}
                name={tag.tagName}
                color={tag.tagColor}
                isAiGenerated={tag.isAiGenerated}
              />
            ))}
          </div>
        )}

        {/* Footer meta */}
        <div
          className="flex items-center justify-between mt-2 pt-2 text-xs"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-tertiary)" }}
        >
          <span>{timeAgo(item.savedAt)}</span>
          {item.readingTime && <span>{formatReadingTime(item.readingTime)}</span>}
        </div>
      </div>
    </Link>
  );
}
