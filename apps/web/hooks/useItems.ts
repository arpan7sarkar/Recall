"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import type { Item, PaginatedResponse } from "@/types";

interface UseItemsOptions {
  page?: number;
  limit?: number;
  type?: string;
  tag?: string;
  source?: string;
  archived?: boolean;
  favorite?: boolean;
}

export function useItems(opts: UseItemsOptions = {}) {
  const { getToken } = useAuth();
  const { page = 1, limit = 20, type, tag, source, archived, favorite } = opts;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type && type !== "all") params.set("type", type);
  if (tag) params.set("tag", tag);
  if (source) params.set("source", source);
  if (archived !== undefined) params.set("archived", String(archived));
  if (favorite !== undefined) params.set("favorite", String(favorite));

  return useQuery({
    queryKey: ["items", opts],
    queryFn: async () => {
      const token = await getToken();
      return api.get<PaginatedResponse<Item>>(`/items?${params}`, { token: token || undefined });
    },
  });
}

export function useItem(id: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const token = await getToken();
      return api.get<Item>(`/items/${id}`, { token: token || undefined });
    },
    enabled: !!id,
  });
}

export function useRelatedItems(id: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["item", id, "related"],
    queryFn: async () => {
      const token = await getToken();
      return api.get<Item[]>(`/items/${id}/related`, { token: token || undefined });
    },
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      url: string;
      itemType?: string;
      tags?: string[];
      collectionId?: string;
      note?: string;
      youtubeTimestamp?: string;
    }) => {
      const token = await getToken();
      return api.post<Item>("/items", data, { token: token || undefined });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useUploadItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = await getToken();
      return api.upload<Item>("/items/upload", formData, { token: token || undefined });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const token = await getToken();
      return api.patch<Item>(`/items/${id}`, data, { token: token || undefined });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", vars.id] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return api.delete(`/items/${id}`, { token: token || undefined });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}
