"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, jsonBody, toQueryString } from "@/lib/api-client";
import { studentsKeys } from "@/lib/queries/students";
import type { Paginated } from "@/types/api";
import type {
  CreateGuardianInput,
  Guardian,
  GuardianProfile,
  LinkGuardianInput,
  UpdateGuardianInput,
  UpdateGuardianLinkInput,
} from "@/types/guardians";

export const guardiansKeys = {
  all: ["guardians"] as const,
  search: (search: string) => [...guardiansKeys.all, "search", search] as const,
};

/**
 * Search existing guardians by first name, last name or phone, e.g. to link a sibling's
 * parent instead of creating a duplicate. Waits for 2+ characters.
 */
export function useGuardianSearch(search: string) {
  const term = search.trim();
  return useQuery({
    queryKey: guardiansKeys.search(term),
    queryFn: () => api<Paginated<Guardian>>(`/guardians${toQueryString({ search: term, limit: 10 })}`),
    enabled: term.length >= 2,
  });
}

/** A guardian's full record (the profile only embeds name, phone and email). */
export function useGuardian(id: string | undefined) {
  return useQuery({
    queryKey: [...guardiansKeys.all, "detail", id],
    queryFn: () => api<GuardianProfile>(`/guardians/${id}`),
    enabled: !!id,
  });
}

/**
 * Guardian data shows up embedded in student profiles (name, phone, link fields),
 * so every guardian mutation refetches both guardian and student queries.
 */
function useGuardiansMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: guardiansKeys.all }),
        queryClient.invalidateQueries({ queryKey: studentsKeys.all }),
      ]),
  });
}

export function useCreateGuardian() {
  return useGuardiansMutation((input: CreateGuardianInput) => api<Guardian>("/guardians", jsonBody("POST", input)));
}

export function useUpdateGuardian() {
  return useGuardiansMutation(({ id, input }: { id: string; input: UpdateGuardianInput }) =>
    api<Guardian>(`/guardians/${id}`, jsonBody("PATCH", input)),
  );
}

export function useLinkGuardian() {
  return useGuardiansMutation(({ studentId, input }: { studentId: string; input: LinkGuardianInput }) =>
    api<GuardianProfile>(`/students/${studentId}/guardians`, jsonBody("POST", input)),
  );
}

export function useUpdateGuardianLink() {
  return useGuardiansMutation(
    ({ studentId, guardianId, input }: { studentId: string; guardianId: string; input: UpdateGuardianLinkInput }) =>
      api<GuardianProfile>(`/students/${studentId}/guardians/${guardianId}`, jsonBody("PATCH", input)),
  );
}

/** Removes the link only; the guardian record itself stays. */
export function useUnlinkGuardian() {
  return useGuardiansMutation(({ studentId, guardianId }: { studentId: string; guardianId: string }) =>
    api<void>(`/students/${studentId}/guardians/${guardianId}`, { method: "DELETE" }),
  );
}
