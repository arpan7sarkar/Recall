export type ItemType =
  | "article"
  | "tweet"
  | "youtube"
  | "pdf"
  | "image"
  | "podcast"
  | "instagram"
  | "linkedin"
  | "link";

export type ItemStatus = "pending" | "processing" | "ready" | "failed";

export type SaveSource = "extension" | "web_url" | "web_upload";

export interface Item {
  id: string;
  userId: string;
  url: string | null;
  title: string;
  description: string | null;
  contentText: string | null;
  thumbnailUrl: string | null;
  fileUrl: string | null;
  itemType: ItemType;
  saveSource: SaveSource;
  status: ItemStatus;
  readingTime: number | null;
  wordCount: number | null;
  sourceDomain: string | null;
  author: string | null;
  publishedAt: string | null;
  savedAt: string;
  lastViewedAt: string | null;
  viewCount: number;
  isArchived: boolean;
  isFavourite: boolean;
  userNote: string | null;
  youtubeTimestamp: number | null;
  tags: ItemTag[];
}

export interface ItemTag {
  tagId: string;
  tagName: string;
  tagColor: string | null;
  isAiGenerated: boolean;
  confidence: number;
}
