"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { useDebounce } from "./useDebounce";
import type { Item } from "@/types";

export function useSearch(
  query: string,
  type: "semantic" | "keyword" = "semantic"
) {
  const { getToken } = useAuth();
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["search", debouncedQuery, type],
    queryFn: async () => {
      const token = await getToken();
      return api.get<Item[]>(
        `/search?q=${encodeURIComponent(debouncedQuery)}&type=${type}`,
        { token: token || undefined }
      );
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });
}
