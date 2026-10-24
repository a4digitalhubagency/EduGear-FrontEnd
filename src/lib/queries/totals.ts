"use client";

import { useQuery } from "@tanstack/react-query";
import { api, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";

type Params = Record<string, string | number | boolean | undefined>;

/**
 * How many rows a list endpoint would return for these filters, without fetching them:
 * asks for one row and reads meta.total. For counts like "active students" or
 * "pending invitations" where the backend has no dedicated count endpoint.
 */
export function useListTotal(path: string, params: Params = {}, enabled = true) {
  return useQuery({
    // Same key shape as the module's own list queries, so their mutations' invalidations reach these too.
    queryKey: [path.split("/")[1], "total", path, params],
    queryFn: async () => (await api<Paginated<unknown>>(`${path}${toQueryString({ ...params, limit: 1 })}`)).meta.total,
    enabled,
  });
}
