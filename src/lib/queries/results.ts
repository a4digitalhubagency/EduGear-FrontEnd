"use client";

import { useQuery } from "@tanstack/react-query";
import { api, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { ResultSheet, ResultSheetSummary } from "@/types/results";

/**
 * An arm's most recently updated result sheet with every student's average and position
 * (results.read), or null if the arm has no results yet. Sheets list newest-updated first.
 */
export function useLatestResultSheet(classArmId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["results", "latest-sheet", classArmId],
    queryFn: async () => {
      const list = await api<Paginated<ResultSheetSummary>>(`/results/sheets${toQueryString({ classArmId, limit: 1, sortOrder: "desc" })}`);
      const latest = list.data[0];
      return latest ? api<ResultSheet>(`/results/sheets/${latest.id}`) : null;
    },
    enabled: enabled && !!classArmId,
  });
}
