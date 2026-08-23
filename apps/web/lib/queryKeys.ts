import type { QueryClient } from "@tanstack/react-query";

export const graphQueryKey = ["graph"] as const;

export function invalidateGraphQuery(queryClient: Pick<QueryClient, "invalidateQueries">) {
  return queryClient.invalidateQueries({ queryKey: graphQueryKey });
}

export function invalidateItemProjectionQueries(
  queryClient: Pick<QueryClient, "invalidateQueries">,
  itemId: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["items"] }),
    queryClient.invalidateQueries({ queryKey: ["item", itemId] }),
    queryClient.invalidateQueries({ queryKey: ["collections"] }),
    queryClient.invalidateQueries({ queryKey: ["collection"] }),
    queryClient.invalidateQueries({ queryKey: ["search"] }),
    invalidateGraphQuery(queryClient),
  ]);
}
