"use client";

import type { ItemType } from "@/types";
import { TYPE_ICONS, TYPE_LABELS } from "@/lib/utils";
import { TYPE_BG_CLASSES } from "@/lib/constants";
import { Icon } from "@/components/shared/Icon";

interface TypeBadgeProps {
  type: ItemType;
  size?: "sm" | "md";
}

export function TypeBadge({ type, size = "sm" }: TypeBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-serif text-[10px] tracking-tight border shadow-sm ${sizeClasses} ${TYPE_BG_CLASSES[type]}`}
      style={{
        borderWidth: "1px",
        borderColor: "rgba(255,255,255,0.05)",
      }}
    >
      <Icon name={TYPE_ICONS[type]} size={iconSize} />
      <span>{TYPE_LABELS[type]}</span>
    </span>
  );
}
