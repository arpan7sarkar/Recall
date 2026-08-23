import type { QueryClient } from "@tanstack/react-query";

export const graphQueryKey = ["graph"] as const;

export function invalidateGraphQuery(queryClient: Pick<QueryClient, "invalidateQueries">) {
  return queryClient.invalidateQueries({ queryKey: graphQueryKey });
}
