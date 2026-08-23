"use client";

import { useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { graphQueryKey } from "@/lib/queryKeys";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  saveSource: string;
  tags: string[];
  size: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function graphRequestPath(forceRefresh: boolean): string {
  return forceRefresh ? "/graph?refresh=1" : "/graph";
}

export function useGraphData() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const forceRefreshRef = useRef(false);

  const query = useQuery({
    queryKey: graphQueryKey,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      const refresh = forceRefreshRef.current;
      forceRefreshRef.current = false;
      return api.get<GraphData>(graphRequestPath(refresh), { token });
    },
    enabled: isLoaded && Boolean(isSignedIn),
    // Graph builds take time, keep fresh for longer
    staleTime: 5 * 60 * 1000, 
  });

  const queryRefetch = query.refetch;
  const refetch = useCallback(() => {
    forceRefreshRef.current = true;
    return queryRefetch();
  }, [queryRefetch]);

  return { ...query, refetch };
}
