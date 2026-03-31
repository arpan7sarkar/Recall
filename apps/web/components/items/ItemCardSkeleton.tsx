"use client";

export function ItemCardSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}
      >
        <div className="skeleton" style={{ width: 56, height: 56, flexShrink: 0 }} />
        <div className="flex-1 space-y-2">
          <div className="skeleton" style={{ height: 14, width: "60%" }} />
          <div className="skeleton" style={{ height: 10, width: "40%" }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}
    >
      <div className="skeleton" style={{ height: 160 }} />
      <div className="p-4 space-y-3">
        <div className="skeleton" style={{ height: 12, width: "30%" }} />
        <div className="skeleton" style={{ height: 14, width: "80%" }} />
        <div className="skeleton" style={{ height: 10, width: "60%" }} />
        <div className="flex gap-1.5 mt-2">
          <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 20, width: 50, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}
