"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { PlatformAdmin, PlatformOperator, PlatformRole, PlatformSchool, PlatformStats, SchoolStatus } from "@/types/platform";

/**
 * The platform console talks to /api/platform/* (its own proxy and cookie), never the school
 * API. A 401 means the 15-minute session ended.
 */
export async function platformApi<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/platform${path}`, {
      method: init.method ?? "GET",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, { message: "Can't reach the server. Please check your connection." });
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data); // a 401 sends the console back to sign-in (PlatformConsole)
  return data as T;
}

const keys = {
  all: ["platform"] as const,
  me: () => [...keys.all, "me"] as const,
  stats: () => [...keys.all, "stats"] as const,
  schools: (q: object) => [...keys.all, "schools", q] as const,
  admins: () => [...keys.all, "admins"] as const,
};

export function usePlatformMe() {
  return useQuery({ queryKey: keys.me(), queryFn: () => platformApi<PlatformOperator>("/me"), retry: false });
}

export function usePlatformStats() {
  return useQuery({ queryKey: keys.stats(), queryFn: () => platformApi<PlatformStats>("/stats") });
}

export type SchoolsQuery = { page: number; status?: SchoolStatus; sortBy: "createdAt" | "name" | "status"; sortOrder: "asc" | "desc" };

export function usePlatformSchools(query: SchoolsQuery) {
  return useQuery({
    queryKey: keys.schools(query),
    queryFn: () => platformApi<Paginated<PlatformSchool>>(`/schools${toQueryString({ ...query, limit: 20 })}`),
    placeholderData: keepPreviousData,
  });
}

/** Operators and owners: every change refreshes the schools list and the totals. */
export function useSchoolAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason, storageQuotaMb }: { id: string; action: "suspend" | "reactivate" | "cancel" | "quota"; reason?: string; storageQuotaMb?: number | null }) =>
      platformApi<PlatformSchool>(`/schools/${id}/${action}`, {
        method: "POST",
        body: action === "quota" ? { storageQuotaMb } : action === "reactivate" ? undefined : { reason },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

/** Owners only. */
export function usePlatformAdmins(enabled: boolean) {
  return useQuery({ queryKey: keys.admins(), queryFn: () => platformApi<PlatformAdmin[]>("/admins"), enabled });
}

export function useGrantPlatformAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: PlatformRole }) => platformApi<PlatformAdmin>("/admins", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.admins() }),
  });
}

export function useRevokePlatformAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi<void>(`/admins/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.admins() }),
  });
}
