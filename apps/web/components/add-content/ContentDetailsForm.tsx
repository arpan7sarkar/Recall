"use client";

import { useRef, useState, useCallback } from "react";
import { useAddContentStore } from "@/store/addContentStore";
import { SOURCE_TYPE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ContentDetailsForm() {
  const {
    selectedType,
    url,
    file,
    title,
    author,
    note,
    podcastName,
    youtubeTimestamp,
    setUrl,
    setFile,
    setTitle,
    setAuthor,
    setNote,
    setPodcastName,
    setYoutubeTimestamp,
    setStep,
  } = useAddContentStore();

  const [activeTab, setActiveTab] = useState<"url" | "file">("url");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sourceOption = SOURCE_TYPE_OPTIONS.find((o) => o.type === selectedType);
  const mode = sourceOption?.inputMode ?? "url";
  const showTabs = mode === "both";

  const isYoutube = selectedType === "youtube";
  const isArticle = selectedType === "article";
  const isPodcast = selectedType === "podcast";
  const isTweet = selectedType === "tweet";
  const isImage = selectedType === "image";
  const isPdf = selectedType === "pdf";

  const getTitleLabel = () => {
    if (isPodcast) return "Episode Title (optional)";
    return (isImage || isPdf) ? "Title *" : "Title (optional)";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) setFile(dropped);
    },
    [setFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const isNextDisabled = activeTab === "url" ? !url.trim() : !file || (isImage || isPdf ? !title.trim() : false);

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          setStep("type");
          setFile(null);
          setUrl("");
        }}
        className="flex items-center gap-1 text-sm font-medium transition-colors focus-ring"
        style={{ color: "var(--accent-500)" }}
      >
        ← Back to type selection
      </button>

      <div className="flex items-center gap-2">
        <span className="text-xl">{sourceOption?.icon}</span>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {sourceOption?.label} Details
        </h3>
      </div>

      {/* Tabs if both modes supported */}
      {showTabs && (
        <div 
          className="flex p-1 rounded-lg" 
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setActiveTab("url")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
              activeTab === "url" ? "shadow-sm" : "opacity-60"
            )}
            style={{ 
              background: activeTab === "url" ? "var(--bg-primary)" : "transparent",
              color: activeTab === "url" ? "var(--accent-600)" : "var(--text-secondary)"
            }}
          >
            🔗 Paste URL
          </button>
          <button
            onClick={() => setActiveTab("file")}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
              activeTab === "file" ? "shadow-sm" : "opacity-60"
            )}
            style={{ 
              background: activeTab === "file" ? "var(--bg-primary)" : "transparent",
              color: activeTab === "file" ? "var(--accent-600)" : "var(--text-secondary)"
            }}
          >
            📁 Upload File
          </button>
        </div>
      )}

      {/* Input Section */}
      {(activeTab === "url" || mode === "url") && (
        <div className="space-y-4">
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
        </div>
      )}

      {(activeTab === "file" || mode === "file") && (
        <div className="space-y-4">
          <div
            className="relative flex flex-col items-center gap-3 p-8 rounded-xl cursor-pointer transition-colors"
            style={{
              border: `1px dashed ${dragActive ? "var(--accent-500)" : "var(--border)"}`,
              background: dragActive ? "var(--accent-50)" : "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={isPdf ? ".pdf" : ".jpg,.jpeg,.png,.gif,.webp"}
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="text-center">
                <span className="text-3xl mb-2 block">{isPdf ? "📄" : "🖼️"}</span>
                <p className="text-sm font-medium truncate max-w-[240px]" style={{ color: "var(--text-primary)" }}>
                  {file.name}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-2 text-xs underline"
                  style={{ color: "var(--error)" }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <span className="text-3xl opacity-40">{isPdf ? "📁" : "🖼️"}</span>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Drop your file here or <span style={{ color: "var(--accent-500)" }}>browse</span>
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Max 20 MB · {isPdf ? ".pdf" : ".jpg, .png, .webp"}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Meta Section */}
      <div className="space-y-4 pt-2">
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
              placeholder="e.g. 1:23:45"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring shadow-sm"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-md)",
              }}
            />
          </div>
        )}

        {/* Podcast Name */}
        {isPodcast && (
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Podcast Name (optional)
            </label>
            <input
              type="text"
              value={podcastName}
              onChange={(e) => setPodcastName(e.target.value)}
              placeholder="e.g. The Daily"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring shadow-sm"
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
        {!isTweet && !isYoutube && (
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              {getTitleLabel()}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={(isImage || isPdf) ? "Give it a title" : "Leave blank to auto-detect"}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring shadow-sm"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-md)",
              }}
              required={isImage || isPdf}
            />
          </div>
        )}

        {/* Author / Source Credit */}
        {(isArticle || isImage) && (
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              {isImage ? "Source Credit (optional)" : "Author (optional)"}
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={isImage ? "@username or site name" : "e.g. Jane Doe"}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring shadow-sm"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-md)",
              }}
            />
          </div>
        )}

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
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none focus-ring shadow-sm"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-md)",
            }}
          />
        </div>
      </div>

      <button
        onClick={() => setStep("metadata")}
        disabled={isNextDisabled}
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
