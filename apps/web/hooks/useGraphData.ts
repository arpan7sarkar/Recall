"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";

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

export function useGraphData() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["graph"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      return api.get<GraphData>("/graph", { token });
    },
    enabled: isLoaded && Boolean(isSignedIn),
    // Graph builds take time, keep fresh for longer
    staleTime: 5 * 60 * 1000, 
  });
}
