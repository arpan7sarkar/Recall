export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  processingTotal?: number;
}

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}
