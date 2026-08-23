"use client";

import { useRef } from "react";
import type { Item } from "@/types";
import { Icon } from "@/components/shared/Icon";
import { timeAgo, extractDomain } from "@/lib/utils";

import Script from "next/script";
import {
  loadTwitterWidgets,
  TWITTER_WIDGET_SCRIPT_ID,
  TWITTER_WIDGET_SCRIPT_SRC,
} from "@/lib/twitterWidgets";

interface TweetPreviewProps {
  item: Item;
}

export function TweetPreview({ item }: TweetPreviewProps) {
  const tweetUrl = item.url || "";
  const tweetContainerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={tweetContainerRef} className="w-full flex justify-center py-4">
      <div className="w-full max-w-[550px]">
        <blockquote className="twitter-tweet" data-media-max-width="560">
          <a href={tweetUrl.replace("x.com", "twitter.com")} target="_blank"></a>
        </blockquote>
        <Script 
          id={TWITTER_WIDGET_SCRIPT_ID}
          src={TWITTER_WIDGET_SCRIPT_SRC}
          strategy="lazyOnload" 
          onLoad={() => {
            loadTwitterWidgets(tweetContainerRef.current);
          }}
          onReady={() => {
            loadTwitterWidgets(tweetContainerRef.current);
          }}
        />
      </div>
    </div>
  );
}
