import type { Item } from "./item";

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  publicSlug: string | null;
  itemCount?: number;
  _count?: {
    items: number;
  };
  createdAt: string;
}

export interface CollectionDetail extends Collection {
  items: Item[];
}

export interface CollectionItem {
  collectionId: string;
  itemId: string;
  position: number;
  addedAt: string;
}
