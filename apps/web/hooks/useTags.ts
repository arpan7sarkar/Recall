"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import type { Tag } from "@/types";

export function useTags() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const token = await getToken();
      return api.get<Tag[]>("/tags", { token: token || undefined });
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      const token = await getToken();
      return api.post<Tag>("/tags", data, { token: token || undefined });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useAttachTag() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ itemId, tagId, tagName }: { itemId: string; tagId?: string; tagName?: string }) => {
      const token = await getToken();
      return api.post(`/tags/attach/${itemId}`, { tagId, tagName }, { token: token || undefined });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["item", vars.itemId] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; color?: string }) => {
      const token = await getToken();
      return api.patch<Tag>(`/tags/${id}`, data, { token: token || undefined });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return api.delete(`/tags/${id}`, { token: token || undefined });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
