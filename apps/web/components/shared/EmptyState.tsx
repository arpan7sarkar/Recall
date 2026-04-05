"use client";

import { Icon } from "./Icon";

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
        <div className="mb-4 opacity-40">
          <Icon name={icon} size={48} />
        </div>
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
          className="btn-primary focus-ring flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
        >
          <span>+</span>
          {action.label}
        </button>
      )}
    </div>
  );
}
