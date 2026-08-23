"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/types";
import { getInstagramEmbedUrl, cn } from "@/lib/utils";
import { shouldLoadThirdPartyEmbed } from "@/lib/dashboardPerformance";
import { SocialPostPreview } from "@/components/items/SocialPostPreview";

interface InstagramAutoEmbedProps {
  item: Item;
  className?: string;
  compact?: boolean;
}

export function InstagramAutoEmbed({ item, className, compact = false }: InstagramAutoEmbedProps) {
  const embedUrl = useMemo(() => getInstagramEmbedUrl(item.url, true), [item.url]);
  const [loaded, setLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supportsIntersectionObserver =
    typeof window !== "undefined" && "IntersectionObserver" in window;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const supportsIntersectionObserver = "IntersectionObserver" in window;
    if (!supportsIntersectionObserver) {
      const frameId = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  if (!embedUrl) {
    return <SocialPostPreview item={item} compact={compact} className={className} />;
  }

  return (
    <div ref={containerRef} className={cn("relative w-full h-full", className)}>
      {(!shouldLoadThirdPartyEmbed({
        isVisible,
        supportsIntersectionObserver,
      }) || !loaded) && (
        <SocialPostPreview item={item} compact={compact} className="h-full border-0 rounded-lg" />
      )}

      {shouldLoadThirdPartyEmbed({
        isVisible,
        supportsIntersectionObserver,
      }) && (
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
      )}
    </div>
  );
}
