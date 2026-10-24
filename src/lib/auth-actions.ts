import { ApiError, api } from "@/lib/api-client";
import { getQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/lib/store/auth-store";

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  useAuthStore.getState().clear();
  // Drop every cached query, so the next user on this tab (possibly another school) starts empty.
  getQueryClient().clear();
}

/** Revokes every session this user has (all devices), then signs out here too. */
export async function logoutEverywhere() {
  await api("/auth/logout-all", { method: "POST" }).catch(() => {});
  await logout();
}

/**
 * Moves the session to another school the user belongs to. Returns the new permissions
 * so the caller can send a parent to the portal and staff to the dashboard.
 * Throws ApiError (e.g. no active access to that school) without touching the session.
 */
export async function switchSchool(schoolId: string): Promise<string[]> {
  const accessToken = useAuthStore.getState().accessToken;
  const res = await fetch("/api/auth/switch-school", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ schoolId }),
    credentials: "include",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new ApiError(res.status, data);

  // Everything cached belongs to the old school.
  getQueryClient().clear();
  useAuthStore.getState().setSession(data);
  return data.permissions;
}
