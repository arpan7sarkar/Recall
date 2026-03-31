export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  publicSlug: string | null;
  itemCount: number;
  createdAt: string;
}

export interface CollectionItem {
  collectionId: string;
  itemId: string;
  position: number;
  addedAt: string;
}
