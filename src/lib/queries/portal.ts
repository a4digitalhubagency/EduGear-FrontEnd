"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, jsonBody, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { StudentStatement } from "@/types/finance";
import type {
  PortalAccess,
  PortalAttendance,
  PortalChildOverview,
  PortalMe,
  PortalNotification,
  PortalResultTerm,
  StartedOnlinePayment,
  SubmitPaymentInput,
} from "@/types/portal";
import type { ReportCard } from "@/types/results";

/** Parent-side keys all start with "portal"; staff-side portal-access keys sit under "guardians". */
export const portalKeys = {
  all: ["portal"] as const,
  me: () => [...portalKeys.all, "me"] as const,
  child: (id: string) => [...portalKeys.all, "child", id] as const,
  fees: (id: string) => [...portalKeys.all, "fees", id] as const,
  results: (id: string) => [...portalKeys.all, "results", id] as const,
  reportCard: (id: string, termId: string) => [...portalKeys.all, "report-card", id, termId] as const,
  attendance: (id: string, termId?: string) => [...portalKeys.all, "attendance", id, termId] as const,
  notifications: (query: object) => [...portalKeys.all, "notifications", query] as const,
};

/** The parent, their children (with balances and latest results) and the unread count. */
export function usePortalMe() {
  return useQuery({ queryKey: portalKeys.me(), queryFn: () => api<PortalMe>("/portal/me") });
}

export function usePortalChild(studentId: string) {
  return useQuery({ queryKey: portalKeys.child(studentId), queryFn: () => api<PortalChildOverview>(`/portal/children/${studentId}`) });
}

/** Same statement shape as the staff fee statement: invoices, payments and a running ledger. */
export function usePortalFees(studentId: string) {
  return useQuery({ queryKey: portalKeys.fees(studentId), queryFn: () => api<StudentStatement>(`/portal/children/${studentId}/fees`) });
}

export function usePortalResultTerms(studentId: string) {
  return useQuery({ queryKey: portalKeys.results(studentId), queryFn: () => api<PortalResultTerm[]>(`/portal/children/${studentId}/results`) });
}

export function usePortalReportCard(studentId: string, termId: string | null) {
  return useQuery({
    queryKey: portalKeys.reportCard(studentId, termId ?? ""),
    queryFn: () => api<ReportCard>(`/portal/children/${studentId}/results/${termId}`),
    enabled: !!termId,
    staleTime: Infinity, // a published report card doesn't change unless results are returned
  });
}

export function usePortalAttendance(studentId: string, termId?: string) {
  return useQuery({
    queryKey: portalKeys.attendance(studentId, termId),
    queryFn: () => api<PortalAttendance>(`/portal/children/${studentId}/attendance${toQueryString({ termId })}`),
  });
}

function usePortalMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: portalKeys.all }) });
}

/**
 * Proof of a payment: optionally upload the teller first (multipart "file"), then submit
 * the payment with its URL. It stays PENDING until the bursar verifies it.
 */
export function useSubmitPortalPayment() {
  return usePortalMutation(async ({ studentId, input, evidence }: { studentId: string; input: Omit<SubmitPaymentInput, "evidenceUrl">; evidence: File | null }) => {
    let evidenceUrl: string | undefined;
    if (evidence) {
      const form = new FormData();
      form.append("file", evidence);
      evidenceUrl = (await api<{ url: string }>(`/portal/children/${studentId}/evidence`, { method: "POST", body: form })).url;
    }
    return api<unknown>(`/portal/children/${studentId}/payments`, jsonBody("POST", { ...input, ...(evidenceUrl ? { evidenceUrl } : {}) }));
  });
}

/** Starts a card payment; the caller sends the parent on to the returned checkout link. */
export function useStartOnlinePayment() {
  return usePortalMutation(({ studentId, studentFeeId, amount }: { studentId: string; studentFeeId: string; amount: number }) =>
    api<StartedOnlinePayment>(`/portal/children/${studentId}/payments/online`, jsonBody("POST", { studentFeeId, amount })),
  );
}

/** "I've paid but it still says pending": asks the provider what happened. */
export function useRefreshOnlinePayment() {
  return usePortalMutation(({ studentId, paymentId }: { studentId: string; paymentId: string }) =>
    api<{ status: string }>(`/portal/children/${studentId}/payments/${paymentId}/refresh`, { method: "POST" }),
  );
}

export function usePortalNotifications(query: { page?: number; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: portalKeys.notifications(query),
    queryFn: () => api<Paginated<PortalNotification> & { unread: number }>(`/portal/notifications${toQueryString({ ...query, limit: 20 })}`),
  });
}

export function useMarkNotificationRead() {
  return usePortalMutation((id: string) => api<PortalNotification>(`/portal/notifications/${id}/read`, { method: "POST" }));
}

export function useMarkAllNotificationsRead() {
  return usePortalMutation(() => api<{ updated: number }>("/portal/notifications/read-all", { method: "POST" }));
}

// --- Staff side: a guardian's portal login ---------------------------------

export function usePortalAccess(guardianId: string, enabled = true) {
  return useQuery({
    queryKey: ["guardians", "portal-access", guardianId],
    queryFn: () => api<PortalAccess>(`/guardians/${guardianId}/portal-access`),
    enabled,
  });
}

/** Invite (or re-send) / revoke a parent's portal login (guardians.update). */
export function usePortalAccessAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guardianId, action }: { guardianId: string; action: "invite" | "revoke" }) =>
      api<PortalAccess>(`/guardians/${guardianId}/portal-access`, { method: action === "invite" ? "POST" : "DELETE" }),
    onSuccess: (_, { guardianId }) => queryClient.invalidateQueries({ queryKey: ["guardians", "portal-access", guardianId] }),
  });
}
