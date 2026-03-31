"use client";

import { useAddContentStore } from "@/store/addContentStore";

export function UrlInputForm() {
  const { selectedType, url, title, note, youtubeTimestamp, setUrl, setTitle, setNote, setYoutubeTimestamp, setStep } =
    useAddContentStore();

  const isYoutube = selectedType === "youtube";

  return (
    <div className="space-y-5">
      <button
        onClick={() => setStep("type")}
        className="flex items-center gap-1 text-sm font-medium transition-colors focus-ring"
        style={{ color: "var(--accent-500)" }}
      >
        ← Back to type selection
      </button>

      <h3
        className="text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Enter the URL
      </h3>

      {/* URL Field */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          URL <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-shadow focus-ring"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-md)",
          }}
          required
        />
      </div>

      {/* YouTube timestamp */}
      {isYoutube && (
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Start at timestamp (optional)
          </label>
          <input
            type="text"
            value={youtubeTimestamp}
            onChange={(e) => setYoutubeTimestamp(e.target.value)}
            placeholder="1:23:45"
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-md)",
            }}
          />
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Leave blank to auto-detect"
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-md)",
          }}
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a quick note about this content…"
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none focus-ring"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-md)",
          }}
        />
      </div>

      <button
        onClick={() => setStep("metadata")}
        disabled={!url.trim()}
        className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all focus-ring disabled:opacity-40"
        style={{
          background: "var(--accent-500)",
          borderRadius: "var(--radius-md)",
        }}
      >
        Next: Add Tags & Collection →
      </button>
    </div>
  );
}
