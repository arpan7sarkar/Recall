"use client";

import { useAddContentStore } from "@/store/addContentStore";
import { SOURCE_TYPE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ItemType } from "@/types";

export function SourceTypePicker() {
  const { selectedType, setSelectedType, setUrl } = useAddContentStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2
          className="text-xl font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          What are you saving?
        </h2>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Choose a content type or just paste a URL below
        </p>
      </div>

      {/* Type cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {SOURCE_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => setSelectedType(opt.type)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-150 focus-ring",
              selectedType === opt.type && "ring-2"
            )}
            style={{
              background:
                selectedType === opt.type
                  ? "var(--accent-50)"
                  : "var(--bg-secondary)",
              border: `1px solid ${
                selectedType === opt.type
                  ? "var(--accent-500)"
                  : "var(--border)"
              }`,
              borderRadius: "var(--radius-lg)",
              ringColor: "var(--accent-500)",
            }}
          >
            <span className="text-2xl">{opt.icon}</span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {opt.label}
            </span>
            <span
              className="text-xs leading-tight"
              style={{ color: "var(--text-tertiary)" }}
            >
              {opt.description}
            </span>
          </button>
        ))}
      </div>

      {/* Fallback URL paste */}
      <div className="relative">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: "var(--bg-primary)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <span style={{ color: "var(--text-tertiary)" }}>🔗</span>
          <input
            type="url"
            placeholder="Or just paste any URL and we'll detect it automatically…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            onChange={(e) => {
              setUrl(e.target.value);
              if (e.target.value.trim()) {
                // Auto-detect type
                const url = e.target.value.toLowerCase();
                let detected: ItemType = "link";
                if (url.includes("youtube.com") || url.includes("youtu.be")) detected = "youtube";
                else if (url.includes("twitter.com") || url.includes("x.com")) detected = "tweet";
                else if (url.endsWith(".pdf")) detected = "pdf";
                else detected = "article";
                setSelectedType(detected);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
