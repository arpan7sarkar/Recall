"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Item, PaginatedResponse } from "@/types";

interface UseItemsOptions {
  page?: number;
  limit?: number;
  type?: string;
  tag?: string;
  source?: string;
}

export function useItems(opts: UseItemsOptions = {}) {
  const { page = 1, limit = 20, type, tag, source } = opts;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type && type !== "all") params.set("type", type);
  if (tag) params.set("tag", tag);
  if (source) params.set("source", source);

  return useQuery({
    queryKey: ["items", opts],
    queryFn: () => api.get<PaginatedResponse<Item>>(`/items?${params}`),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => api.get<Item>(`/items/${id}`),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      url: string;
      itemType?: string;
      tags?: string[];
      collectionId?: string;
      note?: string;
      youtubeTimestamp?: string;
    }) => api.post<Item>("/items", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useUploadItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.upload<Item>("/items/upload", formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: unknown }) =>
      api.patch<Item>(`/items/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", vars.id] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}
