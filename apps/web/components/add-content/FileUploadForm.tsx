"use client";

import { useRef, useState, useCallback } from "react";
import { useAddContentStore } from "@/store/addContentStore";

export function FileUploadForm() {
  const { selectedType, file, title, note, setFile, setTitle, setNote, setStep } =
    useAddContentStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const isPdf = selectedType === "pdf";
  const acceptStr = isPdf ? ".pdf" : ".jpg,.jpeg,.png,.gif,.webp";

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

  return (
    <div className="space-y-5">
      <button
        onClick={() => setStep("type")}
        className="flex items-center gap-1 text-sm font-medium focus-ring"
        style={{ color: "var(--accent-500)" }}
      >
        ← Back to type selection
      </button>

      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Upload your {isPdf ? "document" : "image"}
      </h3>

      {/* Drop zone */}
      <div
        className="relative flex flex-col items-center gap-3 p-8 rounded-xl cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${dragActive ? "var(--accent-500)" : "var(--border)"}`,
          background: dragActive ? "var(--accent-50)" : "var(--bg-primary)",
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
          accept={acceptStr}
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="text-center">
            <span className="text-3xl mb-2 block">{isPdf ? "📄" : "🖼️"}</span>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
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
              Drop your file here or <span style={{ color: "var(--accent-500)" }}>click to browse</span>
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Max 20 MB · {isPdf ? ".pdf" : ".jpg, .png, .gif, .webp"}
            </p>
          </>
        )}
      </div>

      {/* Title (required) */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Title <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this file a title"
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            borderRadius: "var(--radius-md)",
          }}
          required
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
          placeholder="Add a quick note…"
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
        disabled={!file || !title.trim()}
        className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all focus-ring disabled:opacity-40"
        style={{ background: "var(--accent-500)", borderRadius: "var(--radius-md)" }}
      >
        Next: Add Tags & Collection →
      </button>
    </div>
  );
}
