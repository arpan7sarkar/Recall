export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  isAiGenerated: boolean;
  createdAt: string;
}
