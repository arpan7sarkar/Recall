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
          className="text-2xl font-bold tracking-tight mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          What are you saving?
        </h2>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Pick a source type or paste any link below
        </p>
      </div>

      {/* Type cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            }}
          >
            <span className="text-2xl">{opt.icon}</span>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {opt.label}
            </span>
            <span
              className="text-[11px] leading-tight opacity-70"
              style={{ color: "var(--text-secondary)" }}
            >
              {opt.description}
            </span>
          </button>
        ))}
      </div>

      {/* Fallback URL paste */}
      <div className="pt-2">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-sm transition-all focus-within:ring-2 focus-within:ring-accent-500"
          style={{
            background: "var(--bg-primary)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <span className="text-lg opacity-40">🔗</span>
          <input
            type="url"
            placeholder="Or just paste any URL and we'll detect it automatically ▼"
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
            style={{ color: "var(--text-primary)" }}
            onChange={(e) => {
              const val = e.target.value.trim();
              setUrl(val);
              if (val) {
                // Auto-detect type
                const urlLower = val.toLowerCase();
                let detected: ItemType = "article";
                
                if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) detected = "youtube";
                else if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) detected = "tweet";
                else if (urlLower.endsWith(".pdf")) detected = "pdf";
                else if (/\.(jpg|jpeg|png|gif|webp|avif)$/.test(urlLower)) detected = "image";
                else if (urlLower.includes("spotify.com") || urlLower.includes("apple.com/podcast") || urlLower.includes("podcasts.")) detected = "podcast";
                else if (!urlLower.startsWith("http")) detected = "link"; // Default fallback
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
