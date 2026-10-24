"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, jsonBody, toQueryString } from "@/lib/api-client";
import type { Register, SaveRegisterInput, StudentAttendanceSummary } from "@/types/attendance";

export const attendanceKeys = {
  all: ["attendance"] as const,
  register: (classArmId: string, date: string) => [...attendanceKeys.all, "register", classArmId, date] as const,
  armSummary: (termId: string, classArmId: string) => [...attendanceKeys.all, "summary", termId, classArmId] as const,
};

/** A class arm's register for one day (attendance.read). */
export function useRegister(classArmId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: attendanceKeys.register(classArmId ?? "", date ?? ""),
    queryFn: () => api<Register>(`/attendance/register${toQueryString({ classArmId, date })}`),
    enabled: !!classArmId && !!date,
  });
}

/**
 * Take or amend a register. The returned register replaces the cached one, and every
 * attendance summary (dashboard, reports, profiles) refetches.
 */
export function useSaveRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveRegisterInput) => api<Register>("/attendance/register", jsonBody("PUT", input)),
    onSuccess: (register, input) => {
      queryClient.setQueryData(attendanceKeys.register(input.classArmId, input.date), register);
      return queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

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
