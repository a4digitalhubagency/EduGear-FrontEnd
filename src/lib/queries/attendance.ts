"use client";

import { useQueries } from "@tanstack/react-query";
import { api, toQueryString } from "@/lib/api-client";
import type { StudentAttendanceSummary } from "@/types/attendance";

export const attendanceKeys = {
  all: ["attendance"] as const,
  armSummary: (termId: string, classArmId: string) => [...attendanceKeys.all, "summary", termId, classArmId] as const,
};

/**
 * Each arm's term-to-date attendance (attendance.read), one request per arm in parallel.
 * The backend only summarises one arm at a time, so a school-wide view has to combine
 * them; fine for a few dozen arms, but a school-level summary endpoint would scale better.
 */
export function useArmAttendanceSummaries(termId: string | undefined, classArmIds: string[], enabled = true) {
  return useQueries({
    queries: classArmIds.map((classArmId) => ({
      queryKey: attendanceKeys.armSummary(termId ?? "", classArmId),
      queryFn: () =>
        api<StudentAttendanceSummary[]>(`/attendance/summary${toQueryString({ termId, classArmId })}`),
      enabled: enabled && !!termId,
    })),
  });
}
