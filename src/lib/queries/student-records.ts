"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, api, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { StudentTermAttendance } from "@/types/attendance";
import type { AuditLog } from "@/types/audit";
import type { StudentStatement } from "@/types/finance";
import type { ReportCard } from "@/types/results";

/**
 * One student's records from other modules, for the profile's cards and tabs.
 * Keys start with each module's prefix ("attendance", "finance", "results",
 * "audit-logs"), so that module's mutations refresh them too.
 */

export function useStudentAttendance(studentId: string, termId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["attendance", "student", studentId, termId],
    queryFn: () => api<StudentTermAttendance>(`/attendance/students/${studentId}${toQueryString({ termId })}`),
    enabled: enabled && !!termId,
  });
}

export function useStudentStatement(studentId: string, enabled = true) {
  return useQuery({
    queryKey: ["finance", "statement", studentId],
    queryFn: () => api<StudentStatement>(`/finance/students/${studentId}/statement`),
    enabled,
  });
}

/** null when the student has no results for that term yet (the backend answers 404). */
export function useReportCard(studentId: string, termId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["results", "report-card", studentId, termId],
    queryFn: async () => {
      try {
        return await api<ReportCard>(`/results/report-cards/${studentId}${toQueryString({ termId })}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: enabled && !!termId,
  });
}

/** Latest audit entries about one record, e.g. a student (audit.read). */
export function useEntityActivity(entityType: string, entityId: string, limit: number, enabled = true) {
  return useQuery({
    queryKey: ["audit-logs", "entity", entityType, entityId, limit],
    queryFn: () =>
      api<Paginated<AuditLog>>(`/audit-logs${toQueryString({ entityType, entityId, limit, sortOrder: "desc" })}`),
    enabled,
    staleTime: 0,
  });
}
