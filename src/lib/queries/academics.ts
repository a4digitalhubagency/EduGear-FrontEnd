"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, jsonBody, toQueryString } from "@/lib/api-client";
import type {
  AcademicSession,
  ClassArm,
  CreateAcademicSessionInput,
  CreateClassArmInput,
  CreateClassInput,
  CreateTermInput,
  SchoolClass,
  Term,
  UpdateAcademicSessionInput,
  UpdateClassArmInput,
  UpdateClassInput,
  UpdateTermInput,
} from "@/types/academics";
import type { Paginated } from "@/types/api";

/**
 * Query keys all start with "academics", so a mutation can invalidate the whole module at once.
 * The four resources feed each other's counts and labels (termCount, armCount, sessionName,
 * isCurrent), and the lists are small, so refetching all of them beats tracking dependencies.
 */
export const academicsKeys = {
  all: ["academics"] as const,
  sessions: () => [...academicsKeys.all, "sessions"] as const,
  terms: (sessionId?: string) => [...academicsKeys.all, "terms", { sessionId }] as const,
  classes: () => [...academicsKeys.all, "classes"] as const,
  arms: (classId?: string) => [...academicsKeys.all, "arms", { classId }] as const,
};

// Setup lists are short (a few sessions, 3 terms each, ~6 classes), so one page at the max
// size (100) is enough and avoids pagination UI. Revisit if a school ever exceeds it.
const ALL = 100;

export function useSessions() {
  return useQuery({
    queryKey: academicsKeys.sessions(),
    queryFn: () =>
      api<Paginated<AcademicSession>>(`/academics/sessions${toQueryString({ limit: ALL, sortBy: "startDate", sortOrder: "desc" })}`),
  });
}

/** null on 404: the school simply hasn't marked one current yet, which isn't an error to show. */
async function orNullIfMissing<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function useCurrentSession(enabled = true) {
  return useQuery({
    queryKey: [...academicsKeys.sessions(), "current"],
    queryFn: () => orNullIfMissing(api<AcademicSession>("/academics/sessions/current")),
    enabled,
  });
}

export function useCurrentTerm(enabled = true) {
  return useQuery({
    queryKey: [...academicsKeys.all, "terms", "current"],
    queryFn: () => orNullIfMissing(api<Term>("/academics/terms/current")),
    enabled,
  });
}

export function useTerms(sessionId?: string) {
  return useQuery({
    queryKey: academicsKeys.terms(sessionId),
    queryFn: () =>
      api<Paginated<Term>>(`/academics/terms${toQueryString({ limit: ALL, sessionId, sortBy: "startDate", sortOrder: "asc" })}`),
  });
}

export function useClasses() {
  return useQuery({
    queryKey: academicsKeys.classes(),
    queryFn: () =>
      api<Paginated<SchoolClass>>(`/academics/classes${toQueryString({ limit: ALL, sortBy: "level", sortOrder: "asc" })}`),
  });
}

/** Without classId: every arm in the school. */
export function useClassArms(classId?: string) {
  return useQuery({
    queryKey: academicsKeys.arms(classId),
    queryFn: () =>
      api<Paginated<ClassArm>>(`/academics/class-arms${toQueryString({ limit: ALL, classId, sortBy: "name", sortOrder: "asc" })}`),
  });
}

/** Wraps a mutation so that success refetches every academics query. */
function useAcademicsMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: academicsKeys.all }),
  });
}

// --- Sessions ---------------------------------------------------------------

export function useCreateSession() {
  return useAcademicsMutation((input: CreateAcademicSessionInput) =>
    api<AcademicSession>("/academics/sessions", jsonBody("POST", input)),
  );
}

export function useUpdateSession() {
  return useAcademicsMutation(({ id, input }: { id: string; input: UpdateAcademicSessionInput }) =>
    api<AcademicSession>(`/academics/sessions/${id}`, jsonBody("PATCH", input)),
  );
}

export function useSetCurrentSession() {
  return useAcademicsMutation((id: string) =>
    api<AcademicSession>(`/academics/sessions/${id}/set-current`, { method: "POST" }),
  );
}

export function useDeleteSession() {
  return useAcademicsMutation((id: string) => api<void>(`/academics/sessions/${id}`, { method: "DELETE" }));
}

// --- Terms ------------------------------------------------------------------

export function useCreateTerm() {
  return useAcademicsMutation((input: CreateTermInput) => api<Term>("/academics/terms", jsonBody("POST", input)));
}

export function useUpdateTerm() {
  return useAcademicsMutation(({ id, input }: { id: string; input: UpdateTermInput }) =>
    api<Term>(`/academics/terms/${id}`, jsonBody("PATCH", input)),
  );
}

export function useSetCurrentTerm() {
  return useAcademicsMutation((id: string) => api<Term>(`/academics/terms/${id}/set-current`, { method: "POST" }));
}

export function useDeleteTerm() {
  return useAcademicsMutation((id: string) => api<void>(`/academics/terms/${id}`, { method: "DELETE" }));
}

// --- Classes ----------------------------------------------------------------

export function useCreateClass() {
  return useAcademicsMutation((input: CreateClassInput) =>
    api<SchoolClass>("/academics/classes", jsonBody("POST", input)),
  );
}

export function useUpdateClass() {
  return useAcademicsMutation(({ id, input }: { id: string; input: UpdateClassInput }) =>
    api<SchoolClass>(`/academics/classes/${id}`, jsonBody("PATCH", input)),
  );
}

export function useDeleteClass() {
  return useAcademicsMutation((id: string) => api<void>(`/academics/classes/${id}`, { method: "DELETE" }));
}

// --- Class arms -------------------------------------------------------------

export function useCreateClassArm() {
  return useAcademicsMutation((input: CreateClassArmInput) =>
    api<ClassArm>("/academics/class-arms", jsonBody("POST", input)),
  );
}

export function useUpdateClassArm() {
  return useAcademicsMutation(({ id, input }: { id: string; input: UpdateClassArmInput }) =>
    api<ClassArm>(`/academics/class-arms/${id}`, jsonBody("PATCH", input)),
  );
}

export function useDeleteClassArm() {
  return useAcademicsMutation((id: string) => api<void>(`/academics/class-arms/${id}`, { method: "DELETE" }));
}
