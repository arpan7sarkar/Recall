"use client";

import { cn } from "@/lib/utils";

export function ItemCardSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="flex items-center gap-4 p-5 rounded-xl bg-[#0e0e0e] border border-white/4 shadow-sm animate-pulse">
        <div className="bg-white/5 rounded-full" style={{ width: 48, height: 48, flexShrink: 0 }} />
        <div className="flex-1 space-y-2">
          <div className="bg-white/5 rounded-md h-4 w-3/5" />
          <div className="bg-white/5 rounded-md h-3 w-2/5 opacity-60" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-[#0e0e0e] border border-white/4 shadow-sm animate-pulse h-full">
      <div className="bg-white/5 h-48 border-b border-white/4" />
      <div className="p-5 space-y-4 flex-1">
        <div className="bg-white/5 rounded-md h-3 w-1/4" />
        <div className="bg-white/5 rounded-md h-5 w-4/5" />
        <div className="space-y-2">
          <div className="bg-white/5 rounded-md h-3 w-full" />
          <div className="bg-white/5 rounded-md h-3 w-2/3 opacity-60" />
        </div>
      </div>
    </div>
  );
}
