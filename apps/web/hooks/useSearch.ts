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
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["search", debouncedQuery, type],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.get<Item[]>(
        `/search?q=${encodeURIComponent(debouncedQuery)}&type=${type}`,
        { token }
      );
    },
    enabled: debouncedQuery.length >= 2 && isLoaded && Boolean(isSignedIn),
    staleTime: 30_000,
  });
}
