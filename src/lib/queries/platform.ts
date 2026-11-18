"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { PlatformAdmin, PlatformOperator, PlatformRole, PlatformSchool, PlatformStats, SchoolStatus } from "@/types/platform";

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Swaps the refresh token for a new pair. It rotates on every use and the backend treats a
 * replayed one as theft, ending the session, so two refreshes must never overlap. Within a tab
 * concurrent callers share one request; across tabs a Web Lock queues them, and the cookie a
 * queued tab sends is already the one the previous refresh stored.
 */
export function refreshPlatformSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const run = async () => {
    try {
      const res = await fetch("/api/platform/session/refresh", { method: "POST" });
      return res.ok;
    } catch {
      return false;
    }
  };
  // request() resolves with what the callback's promise resolves to; TS's lib types it one level too deep.
  const locked =
    typeof navigator !== "undefined" && navigator.locks
      ? (navigator.locks.request("edugear-platform-refresh", run) as unknown as Promise<boolean>)
      : run();
  const flight = locked.finally(() => {
    refreshInFlight = null;
  });
  refreshInFlight = flight;
  return flight;
}

async function send(path: string, init: { method?: string; body?: unknown }) {
  try {
    return await fetch(`/api/platform${path}`, {
      method: init.method ?? "GET",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, { message: "Can't reach the server. Please check your connection." });
  }
}

/**
 * The platform console talks to /api/platform/* (its own proxy and cookies), never the school
 * API. When the 15-minute access token has lapsed, it refreshes once and retries; a 401 that
 * survives that means the session is over, and the console goes back to sign-in.
 */
export async function platformApi<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res = await send(path, init);
  let data = res.status === 204 ? null : await res.json().catch(() => null);
  // INVALID_CREDENTIALS is a wrong current password on the account forms, not a lapsed session.
  if (res.status === 401 && data?.errorCode !== "INVALID_CREDENTIALS" && (await refreshPlatformSession())) {
    res = await send(path, init);
    data = res.status === 204 ? null : await res.json().catch(() => null);
  }
  if (!res.ok) throw new ApiError(res.status, data);
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

export type SchoolsQuery = { page: number; search?: string; status?: SchoolStatus; sortBy: "createdAt" | "name" | "status"; sortOrder: "asc" | "desc" };

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
