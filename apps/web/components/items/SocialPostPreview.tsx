"use client";

import type { Item } from "@/types";
import { Icon } from "@/components/shared/Icon";
import { cn, extractDomain } from "@/lib/utils";

interface SocialPostPreviewProps {
  item: Item;
  compact?: boolean;
  className?: string;
}

export function SocialPostPreview({ item, compact = false, className }: SocialPostPreviewProps) {
  const domain = extractDomain(item.url);
  const title = (item.title || "").trim();
  const shouldShowTitle = item.itemType !== "instagram" || title.length > 0;
  const description = item.description || item.contentText || "";
  const hasThumb = Boolean(item.thumbnailUrl);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border bg-(--bg-secondary)",
        compact ? "h-full min-h-44" : "h-64",
        className
      )}
    >
      {hasThumb ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <Icon name={item.itemType} size={72} />
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-black/10" />

      <div className="relative z-10 flex h-full flex-col justify-end gap-2 p-4 text-white">
        <div className="flex items-center gap-2 text-[11px] font-medium opacity-90">
          <Icon name={item.itemType} size={14} />
          {domain && <span>{domain}</span>}
          {item.author && <span>· {item.author}</span>}
        </div>

        {shouldShowTitle && (
          <h4 className={cn("font-semibold leading-tight", compact ? "text-sm line-clamp-2" : "text-base line-clamp-2")}>
            {title || "Untitled"}
          </h4>
        )}

        {description && (
          <p className={cn("opacity-90", compact ? "text-xs line-clamp-2" : "text-sm line-clamp-3")}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
