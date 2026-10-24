"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, jsonBody, toQueryString } from "@/lib/api-client";
import { academicsKeys } from "@/lib/queries/academics";
import type { Paginated } from "@/types/api";
import type { ImportReport, ImportStudentsCsvInput } from "@/types/bulk-import";
import type { PromoteStudentsInput, PromotionResult } from "@/types/promotion";
import type {
  AdmitStudentInput,
  ChangeStudentStatusInput,
  Student,
  StudentProfile,
  StudentsQuery,
  UpdateStudentInput,
} from "@/types/students";

export const studentsKeys = {
  all: ["students"] as const,
  list: (query: StudentsQuery) => [...studentsKeys.all, "list", query] as const,
  detail: (id: string) => [...studentsKeys.all, "detail", id] as const,
};

export function useStudents(query: StudentsQuery) {
  return useQuery({
    queryKey: studentsKeys.list(query),
    queryFn: () => api<Paginated<Student>>(`/students${toQueryString(query)}`),
    // Keep showing the current page while the next page/filter loads, instead of flashing empty.
    placeholderData: keepPreviousData,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentsKeys.detail(id),
    queryFn: () => api<StudentProfile>(`/students/${id}`),
  });
}

/**
 * Wraps a student mutation so success refetches every student query. Also refetches
 * academics, whose arm/class studentCount moves when a student is admitted, deleted,
 * moved between arms or changes status (counts include ACTIVE students only).
 */
function useStudentsMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: studentsKeys.all }),
        queryClient.invalidateQueries({ queryKey: academicsKeys.all }),
      ]),
  });
}

export function useAdmitStudent() {
  return useStudentsMutation((input: AdmitStudentInput) => api<Student>("/students", jsonBody("POST", input)));
}

export function useUpdateStudent() {
  return useStudentsMutation(({ id, input }: { id: string; input: UpdateStudentInput }) =>
    api<Student>(`/students/${id}`, jsonBody("PATCH", input)),
  );
}

export function useChangeStudentStatus() {
  return useStudentsMutation(({ id, input }: { id: string; input: ChangeStudentStatusInput }) =>
    api<Student>(`/students/${id}/status`, jsonBody("PATCH", input)),
  );
}

/** Permanent. The backend recommends a status change instead, so the record survives for reporting. */
export function useDeleteStudent() {
  return useStudentsMutation((id: string) => api<void>(`/students/${id}`, { method: "DELETE" }));
}

/** multipart/form-data with a single "file" part; replaces (and deletes) any previous photo. */
export function useUploadStudentPhoto() {
  return useStudentsMutation(({ id, file }: { id: string; file: File }) => {
    const form = new FormData();
    form.append("file", file);
    return api<Student>(`/students/${id}/photo`, { method: "POST", body: form });
  });
}

/**
 * Bulk import from CSV text. With dryRun it only validates; without, it writes (and
 * refetches student lists and academics counts like any other student change).
 */
export function useImportStudents() {
  return useStudentsMutation((input: ImportStudentsCsvInput) =>
    api<ImportReport>("/students/import/csv", jsonBody("POST", input)),
  );
}

/** Every ACTIVE student in one arm (up to the 500 a promotion can move), for a roster. */
export function useArmRoster(classArmId: string | undefined) {
  return useQuery({
    queryKey: [...studentsKeys.all, "arm-roster", classArmId],
    queryFn: async () => {
      const rows: Student[] = [];
      for (let page = 1; page <= 5; page++) {
        const res = await api<Paginated<Student>>(
          `/students${toQueryString({ classArmId, status: "ACTIVE", page, limit: 100, sortBy: "lastName", sortOrder: "asc" })}`,
        );
        rows.push(...res.data);
        if (!res.meta.hasNextPage) break;
      }
      return rows;
    },
    enabled: !!classArmId,
  });
}

/** Promote (or graduate) an arm or part of it; refetches students and academics counts. */
export function usePromoteStudents() {
  return useStudentsMutation((input: PromoteStudentsInput) =>
    api<PromotionResult>("/students/promotions", jsonBody("POST", input)),
  );
}

export function useRemoveStudentPhoto() {
  return useStudentsMutation((id: string) => api<Student>(`/students/${id}/photo`, { method: "DELETE" }));
}
