"use client";

interface TagChipProps {
  name: string;
  color?: string | null;
  isAiGenerated?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

export function TagChip({
  name,
  color,
  isAiGenerated,
  removable,
  onRemove,
}: TagChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors"
      style={{
        background: color ? `${color}18` : "var(--bg-tertiary)",
        color: color ?? "var(--text-secondary)",
        border: `1px solid ${color ? `${color}30` : "var(--border)"}`,
      }}
    >
      {isAiGenerated && (
        <span title="AI-generated tag" className="opacity-60">✨</span>
      )}
      <span>#{name}</span>
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
          aria-label={`Remove tag ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
