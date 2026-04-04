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
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-light transition-colors"
      style={{
        background: color ? `${color}10` : "rgba(255,255,255,0.03)",
        color: color ?? "var(--text-secondary)",
        border: `1px solid ${color ? `${color}20` : "rgba(255,255,255,0.05)"}`,
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
