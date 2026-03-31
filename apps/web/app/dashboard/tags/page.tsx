"use client";

import { MOCK_TAGS } from "@/lib/mock-data";

export default function TagsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Tags
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          {MOCK_TAGS.length} tags in your library
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {MOCK_TAGS.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer card-hover"
            style={{
              background: "var(--bg-secondary)",
              boxShadow: "var(--shadow-card)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: tag.color ?? "var(--text-tertiary)" }}
            />
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {tag.name}
            </span>
            {tag.isAiGenerated && (
              <span className="text-xs opacity-50">✨</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
