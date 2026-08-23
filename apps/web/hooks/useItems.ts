"use client";

import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { invalidateGraphQuery } from "@/lib/queryKeys";
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
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const pollingStartedAt = useRef<number | null>(null);
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
      if (!token) throw new Error("Missing auth token");
      return api.get<PaginatedResponse<Item>>(`/items?${params}`, { token });
    },
    enabled: isLoaded && Boolean(isSignedIn),
    refetchInterval: (query) => {
      const data = query.state.data as PaginatedResponse<Item> | undefined;
      const hasPendingProcessing = data?.processingTotal !== undefined
        ? data.processingTotal > 0
        : data?.data?.some((item) => item.status === "pending" || item.status === "processing");
      if (!hasPendingProcessing) {
        pollingStartedAt.current = null;
        return false;
      }

      pollingStartedAt.current ??= Date.now();
      if (Date.now() - pollingStartedAt.current >= 60_000) return false;
      return 5000;
    },
  });
}

export function useItem(id: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.get<Item>(`/items/${id}`, { token });
    },
    enabled: Boolean(id) && isLoaded && Boolean(isSignedIn),
  });
}

export function useRelatedItems(id: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["item", id, "related"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.get<Item[]>(`/items/${id}/related`, { token });
    },
    enabled: Boolean(id) && isLoaded && Boolean(isSignedIn),
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
      if (!token) throw new Error("Missing auth token");
      return api.post<Item>("/items", data, { token });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      invalidateGraphQuery(qc);
    },
  });
}

export function useUploadItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.upload<Item>("/items/upload", formData, { token });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      invalidateGraphQuery(qc);
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.patch<Item>(`/items/${id}`, data, { token });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", vars.id] });
      invalidateGraphQuery(qc);
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, isFavourite }: { id: string; isFavourite: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.patch<Item>(`/items/${id}`, { isFavourite }, { token });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", vars.id] });
      qc.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

export function useRetryItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.post<Item>(`/items/${id}/retry`, undefined, { token });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", id] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.delete(`/items/${id}`, { token });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", id] });
      invalidateGraphQuery(qc);
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

export function useArchiveItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.post<Item>(`/items/${id}/archive`, undefined, { token });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", id] });
      invalidateGraphQuery(qc);
    },
  });
}

export function useUnarchiveItem() {
  const qc = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.post<Item>(`/items/${id}/unarchive`, undefined, { token });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", id] });
      invalidateGraphQuery(qc);
    },
  });
}
