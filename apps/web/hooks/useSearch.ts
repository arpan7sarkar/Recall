"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDebounce } from "./useDebounce";
import type { Item } from "@/types";

export function useSearch(
  query: string,
  type: "semantic" | "keyword" = "semantic"
) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["search", debouncedQuery, type],
    queryFn: () =>
      api.get<Item[]>(
        `/search?q=${encodeURIComponent(debouncedQuery)}&type=${type}`
      ),
    enabled: debouncedQuery.length >= 2,
  });
}
