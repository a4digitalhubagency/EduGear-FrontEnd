"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, jsonBody, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { InviteStaffInput, StaffMember, StaffQuery, UpdateMembershipInput } from "@/types/users";

export const usersKeys = {
  all: ["users"] as const,
  list: (query: StaffQuery) => [...usersKeys.all, "list", query] as const,
};

/** Active staff, e.g. for a form-teacher picker. Needs users.read, so pass enabled=false without it. */
export function useActiveStaff(enabled = true) {
  return useQuery({
    queryKey: [...usersKeys.all, "active"],
    queryFn: () =>
      api<Paginated<StaffMember>>(`/users${toQueryString({ status: "ACTIVE", limit: 100, sortBy: "lastName", sortOrder: "asc" })}`),
    enabled,
  });
}

export function useStaff(query: StaffQuery) {
  return useQuery({
    queryKey: usersKeys.list(query),
    queryFn: () => api<Paginated<StaffMember>>(`/users${toQueryString(query)}`),
    placeholderData: keepPreviousData,
  });
}

/** Staff changes also move role member counts, so roles ("school") refetch too. */
function useUsersMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: usersKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["school", "roles"] }),
      ]),
  });
}

export function useInviteStaff() {
  return useUsersMutation((input: InviteStaffInput) => api<StaffMember>("/users/invite", jsonBody("POST", input)));
}

export function useUpdateMembership() {
  return useUsersMutation(({ membershipId, input }: { membershipId: string; input: UpdateMembershipInput }) =>
    api<StaffMember>(`/users/${membershipId}`, jsonBody("PATCH", input)),
  );
}

/** Revokes school access only; the person's EduGear account (and other schools) stay. */
export function useRevokeMembership() {
  return useUsersMutation((membershipId: string) => api<unknown>(`/users/${membershipId}`, { method: "DELETE" }));
}
