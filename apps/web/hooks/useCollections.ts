"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import type { Collection, CollectionDetail, CollectionSharePayload } from "@/types";

export function useCollections() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.get<Collection[]>("/collections", { token });
    },
    enabled: isLoaded && Boolean(isSignedIn),
  });
}

export function useCollection(id: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.get<CollectionDetail>(`/collections/${id}`, { token });
    },
    enabled: Boolean(id) && isLoaded && Boolean(isSignedIn),
  });
}

export function usePublicCollection(slug: string) {
  return useQuery({
    queryKey: ["public-collection", slug],
    queryFn: async () => {
      return api.get<CollectionDetail>(`/collections/public/${slug}`);
    },
    enabled: !!slug,
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic?: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.post<Collection>("/collections", data, { token });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateCollection() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; isPublic?: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.patch<Collection>(`/collections/${id}`, data, { token });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collection", vars.id] });
    },
  });
}

export function useShareCollection() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, regenerate }: { id: string; regenerate?: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.post<CollectionSharePayload>(`/collections/${id}/share`, { regenerate }, { token });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collection", vars.id] });
    },
  });
}

export function useUnshareCollection() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.post<CollectionSharePayload>(`/collections/${id}/unshare`, undefined, { token });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collection", vars.id] });
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.delete(`/collections/${id}`, { token });
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collection", id] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useAddItemToCollection() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ collectionId, itemId }: { collectionId: string; itemId: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.post(`/collections/${collectionId}/items`, { itemId }, { token });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collection", vars.collectionId] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", vars.itemId] });
    },
  });
}

export function useRemoveItemFromCollection() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ collectionId, itemId }: { collectionId: string; itemId: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.delete(`/collections/${collectionId}/items/${itemId}`, { token });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      qc.invalidateQueries({ queryKey: ["collection", vars.collectionId] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", vars.itemId] });
    },
  });
}
