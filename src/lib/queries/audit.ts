"use client";

import { useQuery } from "@tanstack/react-query";
import { api, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { AuditLog } from "@/types/audit";

// Fetched before filtering, so sign-ins don't leave the card short.
const SCAN = 20;

/**
 * The latest audit entries for this school, newest first (audit.read), skipping
 * sign-in/out events ("auth.*"): every staff login is audited, and they would push
 * real work off a short list. The endpoint can only filter by one exact action,
 * so the skipping happens here.
 */
export function useRecentActivity(limit: number, enabled = true) {
  return useQuery({
    queryKey: ["audit-logs", "recent", limit],
    queryFn: async () => {
      const page = await api<Paginated<AuditLog>>(`/audit-logs${toQueryString({ limit: SCAN, sortOrder: "desc" })}`);
      return page.data.filter((entry) => !entry.action.startsWith("auth.")).slice(0, limit);
    },
    enabled,
    // Activity changes with every action anyone takes, so don't hold it for the default 30s.
    staleTime: 0,
  });
}
