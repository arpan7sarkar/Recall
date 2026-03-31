"use client";

import { useParams, useRouter } from "next/navigation";
import { MOCK_ITEMS } from "@/lib/mock-data";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { TagChip } from "@/components/shared/TagChip";
import { timeAgo, extractDomain, formatReadingTime } from "@/lib/utils";

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const item = MOCK_ITEMS.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Item not found
        </h2>
        <button
          onClick={() => router.back()}
          className="text-sm underline"
          style={{ color: "var(--accent-500)" }}
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm font-medium mb-6 focus-ring"
        style={{ color: "var(--accent-500)" }}
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Left column — content */}
        <div>
          {/* Thumbnail / header */}
          <div
            className="flex items-center justify-center rounded-xl mb-6"
            style={{
              height: 200,
              background: item.thumbnailUrl
                ? `url(${item.thumbnailUrl}) center/cover`
                : "linear-gradient(135deg, var(--accent-50), var(--bg-tertiary))",
              borderRadius: "var(--radius-lg)",
            }}
          >
            {!item.thumbnailUrl && (
              <span className="text-5xl opacity-20">
                {item.itemType === "article" ? "📄" : item.itemType === "youtube" ? "▶️" : item.itemType === "pdf" ? "📁" : "🔗"}
              </span>
            )}
          </div>

          {/* Type + Domain */}
          <div className="flex items-center gap-3 mb-3">
            <TypeBadge type={item.itemType} size="md" />
            {item.sourceDomain && (
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                {item.sourceDomain}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            {item.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm" style={{ color: "var(--text-tertiary)" }}>
            {item.author && <span>By {item.author}</span>}
            {item.readingTime && <span>· {formatReadingTime(item.readingTime)}</span>}
            <span>· Saved {timeAgo(item.savedAt)}</span>
            <span>· {item.viewCount} views</span>
          </div>

          {/* Description */}
          {item.description && (
            <div
              className="p-5 rounded-xl mb-6"
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {item.description}
              </p>
            </div>
          )}

          {/* User note */}
          {item.userNote && (
            <div
              className="p-4 rounded-xl mb-6"
              style={{
                background: "var(--warm-100)",
                borderRadius: "var(--radius-md)",
                borderLeft: "3px solid var(--warm-500)",
              }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Your note</p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{item.userNote}</p>
            </div>
          )}

          {/* File preview for PDFs */}
          {item.fileUrl && item.itemType === "pdf" && (
            <div
              className="rounded-xl overflow-hidden mb-6"
              style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}
            >
              <div className="p-4 flex items-center justify-between" style={{ background: "var(--bg-tertiary)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>PDF Document</span>
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white focus-ring"
                  style={{ background: "var(--accent-500)", borderRadius: "var(--radius-sm)" }}
                >
                  Open File
                </a>
              </div>
            </div>
          )}

          {/* Related items placeholder */}
          <div
            className="p-6 rounded-xl text-center"
            style={{
              background: "var(--bg-secondary)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              🔗 Related items will appear here once enabled
            </span>
          </div>
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-5">
          {/* Actions */}
          <div
            className="p-4 rounded-xl space-y-3"
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring"
                style={{
                  background: item.isFavourite ? "var(--error)" : "var(--bg-tertiary)",
                  color: item.isFavourite ? "#fff" : "var(--text-secondary)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                {item.isFavourite ? "♥ Favourited" : "♡ Favourite"}
              </button>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  ↗ Open Original
                </a>
              )}
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                📑 Archive
              </button>
            </div>
          </div>

          {/* Tags */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
              Tags
            </h3>
            {item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <TagChip
                    key={tag.tagId}
                    name={tag.tagName}
                    color={tag.tagColor}
                    isAiGenerated={tag.isAiGenerated}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                No tags yet
              </p>
            )}
          </div>

          {/* Info */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
              Details
            </h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt style={{ color: "var(--text-tertiary)" }}>Source</dt>
                <dd style={{ color: "var(--text-primary)" }}>{item.saveSource.replace("_", " ")}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: "var(--text-tertiary)" }}>Status</dt>
                <dd style={{ color: item.status === "ready" ? "var(--success)" : "var(--warning)" }}>
                  {item.status}
                </dd>
              </div>
              {item.wordCount && (
                <div className="flex justify-between">
                  <dt style={{ color: "var(--text-tertiary)" }}>Words</dt>
                  <dd style={{ color: "var(--text-primary)" }}>{item.wordCount.toLocaleString()}</dd>
                </div>
              )}
              {item.url && (
                <div>
                  <dt className="mb-1" style={{ color: "var(--text-tertiary)" }}>URL</dt>
                  <dd className="truncate" style={{ color: "var(--accent-500)" }}>
                    {extractDomain(item.url)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
