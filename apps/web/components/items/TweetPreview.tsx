"use client";

import type { Item } from "@/types";
import { Icon } from "@/components/shared/Icon";
import { timeAgo, extractDomain } from "@/lib/utils";

import Script from "next/script";

interface TweetPreviewProps {
  item: Item;
}

export function TweetPreview({ item }: TweetPreviewProps) {
  const tweetUrl = item.url || "";
  
  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-[550px]">
        <blockquote className="twitter-tweet" data-media-max-width="560">
          <a href={tweetUrl.replace("x.com", "twitter.com")} target="_blank"></a>
        </blockquote>
        <Script 
          src="https://platform.twitter.com/widgets.js" 
          strategy="lazyOnload" 
          onLoad={() => {
            // @ts-ignore - Twitter widget initialization
            if (window.twttr) window.twttr.widgets.load();
          }}
        />
      </div>
    </div>
  );
}
