"use client";

import { useMemo, useState } from "react";
import type { Item } from "@/types";
import { getInstagramEmbedUrl, cn } from "@/lib/utils";
import { SocialPostPreview } from "@/components/items/SocialPostPreview";

interface InstagramAutoEmbedProps {
  item: Item;
  className?: string;
  compact?: boolean;
}

export function InstagramAutoEmbed({ item, className, compact = false }: InstagramAutoEmbedProps) {
  const embedUrl = useMemo(() => getInstagramEmbedUrl(item.url, true), [item.url]);
  const [loaded, setLoaded] = useState(false);

  if (!embedUrl) {
    return <SocialPostPreview item={item} compact={compact} className={className} />;
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      {!loaded && <SocialPostPreview item={item} compact={compact} className="h-full border-0 rounded-lg" />}

      <iframe
        title={item.title || "Instagram embed"}
        src={embedUrl}
        loading="lazy"
        allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        className={cn(
          "absolute inset-0 h-full w-full border-0 rounded-lg transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
