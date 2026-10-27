"use client";

import { useQuery } from "@tanstack/react-query";
import { api, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { AuditLog } from "@/types/audit";

// Fetched a page at a time before filtering: every sign-in and session refresh is audited,
// so a busy school's latest 100 entries can be all "auth.*". The backend's page maximum is 100.
const SCAN = 100;
const MAX_PAGES = 3;

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
      const found: AuditLog[] = [];
      for (let p = 1; p <= MAX_PAGES && found.length < limit; p++) {
        const page = await api<Paginated<AuditLog>>(`/audit-logs${toQueryString({ page: p, limit: SCAN, sortOrder: "desc" })}`);
        found.push(...page.data.filter((entry) => !entry.action.startsWith("auth.")));
        if (!page.meta.hasNextPage) break;
      }
      return found.slice(0, limit);
    },
    enabled,
    // Activity changes with every action anyone takes, so don't hold it for the default 30s.
    staleTime: 0,
  });
}
