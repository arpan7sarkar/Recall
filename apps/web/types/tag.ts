export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  isAiGenerated: boolean;
  _count: {
    items: number;
  };
  createdAt: string;
}
