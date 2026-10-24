"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, jsonBody, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type {
  AssessmentScheme,
  ClassSubject,
  GradeBand,
  GradingScale,
  ReportCard,
  ResultSheet,
  ResultSheetStatus,
  ResultSheetSummary,
  ResultsSetup,
  SaveScoresInput,
  ScoreSheet,
  ScoreSheetQuery,
  Subject,
  TeachingAssignment,
} from "@/types/results";

/**
 * Every results key starts with "results", so a mutation refetches the module at once:
 * a saved score marks the sheet stale, a computed sheet moves report cards and profiles,
 * an approval changes the dashboard's "awaiting approval" count.
 */
export const resultsKeys = {
  all: ["results"] as const,
  subjects: () => [...resultsKeys.all, "subjects"] as const,
  classSubjects: (classId: string) => [...resultsKeys.all, "class-subjects", classId] as const,
  assignments: (query: object) => [...resultsKeys.all, "assignments", query] as const,
  scheme: () => [...resultsKeys.all, "scheme"] as const,
  grading: () => [...resultsKeys.all, "grading"] as const,
  scores: (q: Partial<ScoreSheetQuery>) => [...resultsKeys.all, "scores", q] as const,
  sheets: (query: object) => [...resultsKeys.all, "sheets", query] as const,
  sheet: (id: string) => [...resultsKeys.all, "sheet", id] as const,
  classReportCards: (sheetId: string) => [...resultsKeys.all, "report-cards", sheetId] as const,
};

function useResultsMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resultsKeys.all }),
  });
}

// --- Subjects ---------------------------------------------------------------

export function useSubjects(enabled = true) {
  return useQuery({
    queryKey: resultsKeys.subjects(),
    queryFn: () => api<Paginated<Subject>>(`/results/subjects${toQueryString({ limit: 100, sortBy: "name", sortOrder: "asc" })}`),
    enabled,
  });
}

export function useCreateSubject() {
  return useResultsMutation((input: { name: string; code: string }) => api<Subject>("/results/subjects", jsonBody("POST", input)));
}

export function useUpdateSubject() {
  return useResultsMutation(({ id, input }: { id: string; input: { name?: string; code?: string; isActive?: boolean } }) =>
    api<Subject>(`/results/subjects/${id}`, jsonBody("PATCH", input)),
  );
}

export function useDeleteSubject() {
  return useResultsMutation((id: string) => api<void>(`/results/subjects/${id}`, { method: "DELETE" }));
}

export function useClassSubjects(classId: string | undefined) {
  return useQuery({
    queryKey: resultsKeys.classSubjects(classId ?? ""),
    queryFn: () => api<ClassSubject[]>(`/results/classes/${classId}/subjects`),
    enabled: !!classId,
  });
}

export function useOfferSubject() {
  return useResultsMutation(({ classId, subjectId, isCompulsory }: { classId: string; subjectId: string; isCompulsory: boolean }) =>
    api<unknown>(`/results/classes/${classId}/subjects`, jsonBody("POST", { subjectId, isCompulsory })),
  );
}

export function useSetCompulsory() {
  return useResultsMutation(({ classId, subjectId, isCompulsory }: { classId: string; subjectId: string; isCompulsory: boolean }) =>
    api<unknown>(`/results/classes/${classId}/subjects/${subjectId}`, jsonBody("PATCH", { isCompulsory })),
  );
}

export function useWithdrawSubject() {
  return useResultsMutation(({ classId, subjectId }: { classId: string; subjectId: string }) =>
    api<void>(`/results/classes/${classId}/subjects/${subjectId}`, { method: "DELETE" }),
  );
}

/** Set (membershipId) or clear (null) the subject teacher for one arm. */
export function useSetSubjectTeacher() {
  return useResultsMutation(
    ({ classArmId, subjectId, teacherMembershipId }: { classArmId: string; subjectId: string; teacherMembershipId: string | null }) =>
      teacherMembershipId
        ? api<unknown>(`/results/class-arms/${classArmId}/subjects/${subjectId}/teacher`, jsonBody("PUT", { teacherMembershipId }))
        : api<unknown>(`/results/class-arms/${classArmId}/subjects/${subjectId}/teacher`, { method: "DELETE" }),
  );
}

/** Who teaches what. mine: only the signed-in teacher's own subjects (results.read). */
export function useTeachingAssignments(query: { mine?: boolean; classArmId?: string }, enabled = true) {
  return useQuery({
    queryKey: resultsKeys.assignments(query),
    queryFn: () => api<TeachingAssignment[]>(`/results/teaching-assignments${toQueryString(query)}`),
    enabled,
  });
}

// --- Assessment scheme and grading -----------------------------------------

export function useAssessmentScheme(enabled = true) {
  return useQuery({ queryKey: resultsKeys.scheme(), queryFn: () => api<AssessmentScheme>("/results/assessment-scheme"), enabled });
}

export function useSetAssessmentScheme() {
  return useResultsMutation((components: { name: string; maxScore: number }[]) =>
    api<AssessmentScheme>("/results/assessment-scheme", jsonBody("PUT", { components })),
  );
}

export function useGradingScale(enabled = true) {
  return useQuery({ queryKey: resultsKeys.grading(), queryFn: () => api<GradingScale>("/results/grading-scale"), enabled });
}

export function useSetGradingScale() {
  return useResultsMutation((bands: GradeBand[]) => api<GradingScale>("/results/grading-scale", jsonBody("PUT", { bands })));
}

/** 3 x 10-mark CAs and a 70-mark exam, and the WAEC A1-F9 scale, where nothing is set yet. */
export function useApplyResultsDefaults() {
  return useResultsMutation(() => api<ResultsSetup>("/results/setup-defaults", { method: "POST" }));
}

// --- Scores -----------------------------------------------------------------

export function useScoreSheet(query: Partial<ScoreSheetQuery>) {
  const ready = !!query.classArmId && !!query.subjectId && !!query.termId;
  return useQuery({
    queryKey: resultsKeys.scores(query),
    queryFn: () => api<ScoreSheet>(`/results/scores${toQueryString(query)}`),
    enabled: ready,
  });
}

/** All or nothing: on a bad cell the backend saves nothing and lists every problem. */
export function useSaveScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveScoresInput) => api<ScoreSheet>("/results/scores", jsonBody("PUT", input)),
    onSuccess: (sheet, { classArmId, subjectId, termId }) => {
      queryClient.setQueryData(resultsKeys.scores({ classArmId, subjectId, termId }), sheet);
      return queryClient.invalidateQueries({ queryKey: resultsKeys.all });
    },
  });
}

// --- Result sheets ----------------------------------------------------------

export function useResultSheets(query: { termId?: string; classArmId?: string; status?: ResultSheetStatus }, enabled = true) {
  return useQuery({
    queryKey: resultsKeys.sheets(query),
    queryFn: () => api<Paginated<ResultSheetSummary>>(`/results/sheets${toQueryString({ ...query, limit: 100 })}`),
    placeholderData: keepPreviousData,
    enabled: enabled && !!query.termId,
  });
}

export function useResultSheet(id: string | undefined) {
  return useQuery({
    queryKey: resultsKeys.sheet(id ?? ""),
    queryFn: () => api<ResultSheet>(`/results/sheets/${id}`),
    enabled: !!id,
  });
}

/**
 * An arm's most recently updated result sheet with every student's average and position
 * (results.read), or null if the arm has no results yet. Sheets list newest-updated first.
 */
export function useLatestResultSheet(classArmId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...resultsKeys.all, "latest-sheet", classArmId],
    queryFn: async () => {
      const list = await api<Paginated<ResultSheetSummary>>(`/results/sheets${toQueryString({ classArmId, limit: 1, sortOrder: "desc" })}`);
      const latest = list.data[0];
      return latest ? api<ResultSheet>(`/results/sheets/${latest.id}`) : null;
    },
    enabled: enabled && !!classArmId,
  });
}

/** Compute (or recompute) a class's results: form teacher or principal, drafts only. */
export function useComputeSheet() {
  return useResultsMutation((input: { classArmId: string; termId: string }) =>
    api<ResultSheet>("/results/sheets/compute", jsonBody("POST", input)),
  );
}

export type SheetAction = "submit" | "approve" | "publish";

export function useSheetAction() {
  return useResultsMutation(({ id, action }: { id: string; action: SheetAction }) =>
    api<ResultSheet>(`/results/sheets/${id}/${action}`, { method: "POST" }),
  );
}

export function useReturnSheet() {
  return useResultsMutation(({ id, reason }: { id: string; reason: string }) =>
    api<ResultSheet>(`/results/sheets/${id}/return`, jsonBody("POST", { reason })),
  );
}

export function useSheetComment() {
  return useResultsMutation(
    ({ id, studentId, input }: { id: string; studentId: string; input: { formTeacherComment?: string | null; principalComment?: string | null } }) =>
      api<ResultSheet>(`/results/sheets/${id}/students/${studentId}/comment`, jsonBody("PATCH", input)),
  );
}

export function useClassReportCards(sheetId: string | undefined) {
  return useQuery({
    queryKey: resultsKeys.classReportCards(sheetId ?? ""),
    queryFn: () => api<ReportCard[]>(`/results/sheets/${sheetId}/report-cards`),
    enabled: !!sheetId,
  });
}

/** null when the student has no results for that term yet (the backend answers 404). */
export async function fetchReportCard(studentId: string, termId: string) {
  try {
    return await api<ReportCard>(`/results/report-cards/${studentId}${toQueryString({ termId })}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
