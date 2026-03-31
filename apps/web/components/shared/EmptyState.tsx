"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <span className="text-5xl mb-4 opacity-40">{icon}</span>
      )}
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-md mb-6"
        style={{ color: "var(--text-tertiary)" }}
      >
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-all focus-ring"
          style={{
            background: "var(--accent-500)",
            borderRadius: "var(--radius-md)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-600)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-500)")}
        >
          <span>+</span>
          {action.label}
        </button>
      )}
    </div>
  );
}
