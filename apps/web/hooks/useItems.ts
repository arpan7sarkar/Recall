"use client";

import { useRef } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { invalidateGraphQuery, invalidateItemProjectionQueries } from "@/lib/queryKeys";
import {
  getItemProcessingPollInterval,
} from "@/lib/dashboardPerformance";
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

type InfiniteItemsOptions = Omit<UseItemsOptions, "page">;

function buildItemsParams(opts: InfiniteItemsOptions, page: number) {
  const { limit = 20, type, tag, source, archived, favorite } = opts;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type && type !== "all") params.set("type", type);
  if (tag) params.set("tag", tag);
  if (source) params.set("source", source);
  if (archived !== undefined) params.set("archived", String(archived));
  if (favorite !== undefined) params.set("favorite", String(favorite));
  return params;
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
        return getItemProcessingPollInterval({
          hasPendingProcessing: false,
          pollingStartedAt: null,
          now: Date.now(),
        });
      }

      pollingStartedAt.current ??= Date.now();
      return getItemProcessingPollInterval({
        hasPendingProcessing: Boolean(hasPendingProcessing),
        pollingStartedAt: pollingStartedAt.current,
        now: Date.now(),
      });
    },
    refetchIntervalInBackground: false,
  });
}

export function useInfiniteItems(opts: InfiniteItemsOptions = {}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const pollingStartedAt = useRef<number | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["items", "infinite", opts],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.get<PaginatedResponse<Item>>(`/items?${buildItemsParams(opts, pageParam)}`, { token });
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: isLoaded && Boolean(isSignedIn),
    refetchInterval: (currentQuery) => {
      const queryData = currentQuery.state.data as InfiniteData<PaginatedResponse<Item>> | undefined;
      const firstPage = queryData?.pages[0];
      const hasPendingProcessing = firstPage?.processingTotal !== undefined
        ? firstPage.processingTotal > 0
        : queryData?.pages.some((page) =>
            page.data.some((item) => item.status === "pending" || item.status === "processing"),
          ) ?? false;

      if (!hasPendingProcessing) {
        pollingStartedAt.current = null;
        return getItemProcessingPollInterval({
          hasPendingProcessing: false,
          pollingStartedAt: null,
          now: Date.now(),
        });
      }

      pollingStartedAt.current ??= Date.now();
      return getItemProcessingPollInterval({
        hasPendingProcessing: true,
        pollingStartedAt: pollingStartedAt.current,
        now: Date.now(),
      });
    },
    refetchIntervalInBackground: false,
  });

  const pages = query.data?.pages ?? [];
  const items = pages.flatMap((page) => page.data);
  const firstPage = pages[0];

  return {
    ...query,
    items,
    total: firstPage?.total ?? 0,
    processingTotal: firstPage?.processingTotal ?? items.filter((item) =>
      item.status === "pending" || item.status === "processing",
    ).length,
  };
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
      return invalidateItemProjectionQueries(qc, id);
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
      return invalidateItemProjectionQueries(qc, id);
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
      return invalidateItemProjectionQueries(qc, id);
    },
  });
}
