import type { ItemType } from "@/types";
import { TYPE_COLORS } from "@/lib/constants";
import { TYPE_LABELS } from "@/lib/utils";

export interface GraphLegendItem {
  type: ItemType;
  label: string;
  color: string;
  withBorder?: boolean;
}

/**
 * Keep the graph legend and canvas nodes on the same palette as the item badges.
 * This prevents newly supported source types from silently falling back to black.
 */
const GRAPH_TYPES: ItemType[] = [
  "article",
  "youtube",
  "tweet",
  "pdf",
  "podcast",
  "image",
  "instagram",
  "linkedin",
  "link",
];

export const GRAPH_LEGEND_ITEMS: GraphLegendItem[] = GRAPH_TYPES.map((type) => ({
  type,
  label: TYPE_LABELS[type],
  color: TYPE_COLORS[type],
  withBorder: type === "image" || type === "link",
}));

export function getGraphNodeColor(type: string): string {
  return Object.prototype.hasOwnProperty.call(TYPE_COLORS, type)
    ? TYPE_COLORS[type as ItemType]
    : TYPE_COLORS.link;
}
