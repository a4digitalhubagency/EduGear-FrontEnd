"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, jsonBody, toQueryString } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type {
  AssignInvoicesInput,
  AssignInvoicesResult,
  CollectionReport,
  CreateFeeStructureInput,
  Debtor,
  DebtorsQuery,
  FeeCategory,
  FeeStructure,
  FeeStructureStatus,
  FinanceReportQuery,
  Invoice,
  InvoicesQuery,
  Payment,
  PaymentsQuery,
  Receipt,
  RecordPaymentInput,
  SendRemindersInput,
  SendRemindersResult,
  UpdateFeeStructureInput,
} from "@/types/finance";

/**
 * Every finance query key starts with "finance" (the dashboard's finance totals too),
 * so any finance mutation can refetch the lot: a verified payment moves the summary,
 * debtors, invoices and the payment list at once.
 */
export const financeKeys = {
  all: ["finance"] as const,
  summary: (query: FinanceReportQuery) => [...financeKeys.all, "summary", query] as const,
  debtors: (query: DebtorsQuery) => [...financeKeys.all, "debtors", query] as const,
  payments: (query: PaymentsQuery) => [...financeKeys.all, "payments", query] as const,
  receipt: (paymentId: string) => [...financeKeys.all, "receipt", paymentId] as const,
  invoices: (query: InvoicesQuery) => [...financeKeys.all, "invoices", query] as const,
  structures: (query: object) => [...financeKeys.all, "structures", query] as const,
  categories: () => [...financeKeys.all, "categories"] as const,
};

/** Billed, collected and outstanding totals (finance.read). */
export function useFinanceSummary(query: FinanceReportQuery, enabled = true) {
  return useQuery({
    queryKey: financeKeys.summary(query),
    queryFn: () => api<CollectionReport>(`/finance/reports/summary${toQueryString(query)}`),
    enabled,
  });
}

export function useDebtors(query: DebtorsQuery, enabled = true) {
  return useQuery({
    queryKey: financeKeys.debtors(query),
    queryFn: () => api<Paginated<Debtor>>(`/finance/reports/debtors${toQueryString(query)}`),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePayments(query: PaymentsQuery) {
  return useQuery({
    queryKey: financeKeys.payments(query),
    queryFn: () => api<Paginated<Payment>>(`/finance/payments${toQueryString(query)}`),
    placeholderData: keepPreviousData,
  });
}

/** path: where to fetch it; parents use /portal/children/:studentId/payments/:id/receipt. */
export function useReceipt(paymentId: string, path = `/finance/payments/${paymentId}/receipt`) {
  return useQuery({
    queryKey: financeKeys.receipt(paymentId),
    queryFn: () => api<Receipt>(path),
    staleTime: Infinity, // a receipt never changes once issued
  });
}

export function useInvoices(query: InvoicesQuery, enabled = true) {
  return useQuery({
    queryKey: financeKeys.invoices(query),
    queryFn: () => api<Paginated<Invoice>>(`/finance/invoices${toQueryString(query)}`),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useFeeStructures(query: { sessionId?: string; status?: FeeStructureStatus }, enabled = true) {
  return useQuery({
    queryKey: financeKeys.structures(query),
    queryFn: () =>
      api<Paginated<FeeStructure>>(`/finance/fee-structures${toQueryString({ ...query, limit: 100, sortBy: "createdAt", sortOrder: "desc" })}`),
    enabled,
  });
}

export function useFeeCategories(enabled = true) {
  return useQuery({
    queryKey: financeKeys.categories(),
    queryFn: () => api<Paginated<FeeCategory>>(`/finance/fee-categories${toQueryString({ limit: 100, sortBy: "name", sortOrder: "asc" })}`),
    enabled,
  });
}

function useFinanceMutation<TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  });
}

// --- Payments ---------------------------------------------------------------

/** Recorded as PENDING; it only counts once verified. */
export function useRecordPayment() {
  return useFinanceMutation((input: RecordPaymentInput) => api<Payment>("/finance/payments", jsonBody("POST", input)));
}

/** Verifying issues the receipt number and reduces the invoice balance. */
export function useVerifyPayment() {
  return useFinanceMutation((id: string) => api<Payment>(`/finance/payments/${id}/verify`, { method: "POST" }));
}

export function useRejectPayment() {
  return useFinanceMutation(({ id, reason }: { id: string; reason: string }) =>
    api<Payment>(`/finance/payments/${id}/reject`, jsonBody("POST", { reason })),
  );
}

// --- Invoices ---------------------------------------------------------------

export function useAssignInvoices() {
  return useFinanceMutation((input: AssignInvoicesInput) =>
    api<AssignInvoicesResult>("/finance/invoices/assign", jsonBody("POST", input)),
  );
}

export type InvoiceAdjustment = { kind: "discount"; amount: number; reason: string } | { kind: "waive" | "cancel"; reason: string };

/** Discount (an absolute naira amount), waive (write off) or cancel (raised in error). All need a reason. */
export function useAdjustInvoice() {
  return useFinanceMutation(({ id, adjustment }: { id: string; adjustment: InvoiceAdjustment }) => {
    const { kind, ...body } = adjustment;
    return api<Invoice>(`/finance/invoices/${id}/${kind}`, jsonBody("POST", body));
  });
}

// --- Reminders --------------------------------------------------------------

/** With dryRun: who would be emailed. Without: sends the emails. */
export function useSendReminders() {
  return useFinanceMutation((input: SendRemindersInput) =>
    api<SendRemindersResult>("/finance/reminders", jsonBody("POST", input)),
  );
}

// --- Fee structures and categories -----------------------------------------

export function useCreateFeeStructure() {
  return useFinanceMutation((input: CreateFeeStructureInput) =>
    api<FeeStructure>("/finance/fee-structures", jsonBody("POST", input)),
  );
}

export function useUpdateFeeStructure() {
  return useFinanceMutation(({ id, input }: { id: string; input: UpdateFeeStructureInput }) =>
    api<FeeStructure>(`/finance/fee-structures/${id}`, jsonBody("PATCH", input)),
  );
}

export function useFeeStructureAction() {
  return useFinanceMutation(({ id, action }: { id: string; action: "publish" | "archive" }) =>
    api<FeeStructure>(`/finance/fee-structures/${id}/${action}`, { method: "POST" }),
  );
}

export function useDeleteFeeStructure() {
  return useFinanceMutation((id: string) => api<void>(`/finance/fee-structures/${id}`, { method: "DELETE" }));
}

export function useCreateFeeCategory() {
  return useFinanceMutation((input: { name: string; description?: string | null }) =>
    api<FeeCategory>("/finance/fee-categories", jsonBody("POST", input)),
  );
}

export function useUpdateFeeCategory() {
  return useFinanceMutation(
    ({ id, input }: { id: string; input: { name?: string; description?: string | null; isActive?: boolean } }) =>
      api<FeeCategory>(`/finance/fee-categories/${id}`, jsonBody("PATCH", input)),
  );
}

export function useDeleteFeeCategory() {
  return useFinanceMutation((id: string) => api<void>(`/finance/fee-categories/${id}`, { method: "DELETE" }));
}
