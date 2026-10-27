"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, jsonBody, toQueryString } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth-store";
import type { Paginated } from "@/types/api";
import type {
  CreateRoleInput, FilePurpose, PermissionInfo, Role, School, SchoolSettings, StorageQuota, StoredFile, UpdateSchoolInput, UpdateSchoolSettingsInput,
} from "@/types/school";

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

// --- Roles (roles.update) ---------------------------------------------------

/** Role changes can rename what staff rows show, so both the roles list and staff refetch. */
function useRoleMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: schoolKeys.roles() });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/** You can only grant permissions you hold yourself; the backend names any you don't. */
export function useCreateRole() {
  return useRoleMutation((input: CreateRoleInput) => api<Role>("/schools/me/roles", jsonBody("POST", input)));
}

/** Rename or re-describe. Standard (system) roles keep their names. */
export function useUpdateRole() {
  return useRoleMutation(({ id, input }: { id: string; input: { name?: string; description?: string | null } }) =>
    api<Role>(`/schools/me/roles/${id}`, jsonBody("PATCH", input)),
  );
}

/** The complete set after the change, not a delta. The proprietor role can't be changed. */
export function useSetRolePermissions() {
  return useRoleMutation(({ id, permissions }: { id: string; permissions: string[] }) =>
    api<Role>(`/schools/me/roles/${id}/permissions`, jsonBody("PUT", { permissions })),
  );
}

/** Empties a role before it can be deleted. */
export function useReassignRoleMembers() {
  return useRoleMutation(({ id, toRoleId }: { id: string; toRoleId: string }) =>
    api<{ moved: number }>(`/schools/me/roles/${id}/reassign-members`, jsonBody("POST", { toRoleId })),
  );
}

/** Custom roles nobody holds. */
export function useDeleteRole() {
  return useRoleMutation((id: string) => api<void>(`/schools/me/roles/${id}`, { method: "DELETE" }));
}

// --- File storage -----------------------------------------------------------

export function useStorageQuota(enabled = true) {
  return useQuery({ queryKey: [...schoolKeys.all, "storage"], queryFn: () => api<StorageQuota>("/files/quota"), enabled });
}

/** One kind of file (the backend requires a purpose). The first 100 is plenty for a clean-up list. */
export function useSchoolFiles(purpose: FilePurpose, enabled = true) {
  return useQuery({
    queryKey: [...schoolKeys.all, "files", purpose],
    queryFn: () => api<Paginated<StoredFile>>(`/files${toQueryString({ purpose, limit: 100 })}`),
    enabled,
  });
}

/** Payment evidence can't be deleted; the backend says so. */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/files/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: schoolKeys.all }),
  });
}
