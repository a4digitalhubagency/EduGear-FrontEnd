"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, jsonBody } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth-store";
import type { PermissionInfo, Role, School, SchoolSettings, UpdateSchoolInput, UpdateSchoolSettingsInput } from "@/types/school";

export const schoolKeys = {
  all: ["school"] as const,
  profile: () => [...schoolKeys.all, "profile"] as const,
  settings: () => [...schoolKeys.all, "settings"] as const,
  roles: () => [...schoolKeys.all, "roles"] as const,
  permissions: () => [...schoolKeys.all, "permissions"] as const,
};

export function useSchool() {
  return useQuery({ queryKey: schoolKeys.profile(), queryFn: () => api<School>("/schools/me") });
}

export function useSchoolSettings() {
  return useQuery({ queryKey: schoolKeys.settings(), queryFn: () => api<SchoolSettings>("/schools/me/settings") });
}

export function useRoles(enabled = true) {
  return useQuery({ queryKey: schoolKeys.roles(), queryFn: () => api<Role[]>("/schools/me/roles"), enabled });
}

/** The catalogue never changes at runtime, so it's fetched once per session. */
export function usePermissionCatalogue(enabled = true) {
  return useQuery({
    queryKey: schoolKeys.permissions(),
    queryFn: () => api<PermissionInfo[]>("/schools/me/permissions"),
    enabled,
    staleTime: Infinity,
  });
}

/**
 * Every profile change returns the updated School: store it straight into the cache, and
 * keep the auth store's school name in step, since the header and dashboard greet with it.
 */
function useSchoolProfileMutation<TVars>(mutationFn: (vars: TVars) => Promise<School>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (school) => {
      queryClient.setQueryData(schoolKeys.profile(), school);
      const active = useAuthStore.getState().activeSchool;
      if (active) useAuthStore.setState({ activeSchool: { ...active, schoolName: school.name } });
    },
  });
}

export function useUpdateSchool() {
  return useSchoolProfileMutation((input: UpdateSchoolInput) => api<School>("/schools/me", jsonBody("PATCH", input)));
}

/** multipart/form-data with one "file" part; replaces (and deletes) the previous logo. */
export function useUploadSchoolLogo() {
  return useSchoolProfileMutation((file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api<School>("/schools/me/logo", { method: "POST", body: form });
  });
}

export function useRemoveSchoolLogo() {
  return useSchoolProfileMutation(() => api<School>("/schools/me/logo", { method: "DELETE" }));
}

export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSchoolSettingsInput) =>
      api<SchoolSettings>("/schools/me/settings", jsonBody("PATCH", input)),
    onSuccess: (settings) => queryClient.setQueryData(schoolKeys.settings(), settings),
  });
}
