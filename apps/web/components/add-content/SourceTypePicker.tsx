"use client";

import { useAddContentStore } from "@/store/addContentStore";
import { SOURCE_TYPE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ItemType } from "@/types";
import { Icon } from "@/components/shared/Icon";

export function SourceTypePicker() {
  const { selectedType, setSelectedType, setUrl } = useAddContentStore();

  return (
    <div className="space-y-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-(--text-primary) tracking-tight mb-2">
          What are you saving?
        </h2>
        <p className="text-sm font-light text-muted-foreground">
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
            <div className="flex items-center justify-center p-3 rounded-full mb-1" style={{ background: "var(--bg-primary)", color: "var(--accent-500)" }}>
              <Icon name={opt.icon} size={28} />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {opt.label}
            </span>
            <span
              className="text-[11px] leading-tight opacity-70"
              style={{ color: "var(--text-primary)" }}
            >
              {opt.description}
            </span>
          </button>
        ))}
      </div>

      {/* Fallback URL paste */}
      <div className="pt-4">
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-border bg-(--bg-primary)/40 transition-all duration-300 focus-within:border-(--accent-500)/30 focus-within:shadow-[0_0_15px_rgba(192,192,192,0.05)]">
          <div className="flex items-center justify-center text-(--text-tertiary)" style={{ width: 24 }}>
            <Icon name="link" size={18} />
          </div>
          <input
            type="url"
            placeholder="Or just paste any URL here..."
            className="flex-1 bg-transparent text-sm font-light text-(--text-primary) outline-none placeholder:text-(--text-tertiary)"
            onChange={(e) => {
              const val = e.target.value.trim();
              setUrl(val);
              if (val) {
                // Auto-detect type
                const urlLower = val.toLowerCase();
                let detected: ItemType = "article";
                
                if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) detected = "youtube";
                else if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) detected = "tweet";
                else if (urlLower.includes("instagram.com")) detected = "instagram";
                else if (urlLower.includes("linkedin.com")) detected = "linkedin";
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
