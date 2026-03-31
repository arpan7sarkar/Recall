"use client";

import type { ItemType } from "@/types";
import { TYPE_ICONS, TYPE_LABELS } from "@/lib/utils";
import { TYPE_BG_CLASSES } from "@/lib/constants";

interface TypeBadgeProps {
  type: ItemType;
  size?: "sm" | "md";
}

export function TypeBadge({ type, size = "sm" }: TypeBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${TYPE_BG_CLASSES[type]}`}
    >
      <span>{TYPE_ICONS[type]}</span>
      <span>{TYPE_LABELS[type]}</span>
    </span>
  );
}
