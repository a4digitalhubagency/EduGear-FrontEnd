"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Receipt as ReceiptIcon, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  IconAction,
  LoadingText,
  PaginationFooter,
  Pill,
  RetryButton,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TableStateRow,
} from "@/components/ui/table";
import { ReasonModal } from "@/components/finance/ReasonModal";
import { ReceiptModal } from "@/components/finance/ReceiptModal";
import { RecordPaymentModal } from "@/components/finance/RecordPaymentModal";
import { errorMessage } from "@/lib/api-client";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "@/lib/finance-labels";
import { useDebouncedValue } from "@/lib/hooks";
import { usePayments, useRejectPayment, useVerifyPayment } from "@/lib/queries/finance";
import { useCan } from "@/lib/store/auth-store";
import { cn, formatDate, formatNaira } from "@/lib/utils";
import { PAYMENT_METHODS, PAYMENT_STATUSES, type Payment, type PaymentMethod, type PaymentStatus } from "@/types/finance";

const COLUMNS = 7;

/**
 * Payments tab: everything recorded, with verify/reject for pending ones and receipts for verified.
 * autoRecord opens the Record Payment form straight away (the "Record Payment" shortcuts).
 */
export function PaymentsPanel({ autoRecord = false }: { autoRecord?: boolean }) {
  const canRecord = useCan("finance.create");
  const canVerify = useCan("finance.verify");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search);

  const payments = usePayments({
    page,
    limit: 20,
    search: debounced.trim() || undefined,
    status: status || undefined,
    method: method || undefined,
    sortBy: "paidAt",
    sortOrder: "desc",
  });
  const verify = useVerifyPayment();
  const reject = useRejectPayment();

  const [recording, setRecording] = useState(autoRecord && canRecord);

  function closeRecording() {
    setRecording(false);
    // Drop "record=1" so a refresh or Back doesn't reopen the form; Next's router follows replaceState.
    if (autoRecord) window.history.replaceState(null, "", "/finance?tab=payments");
  }
  const [rejecting, setRejecting] = useState<Payment | null>(null);
  const [receiptFor, setReceiptFor] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function verifyPayment(payment: Payment) {
    setActionError(null);
    verify.mutate(payment.id, { onError: (err) => setActionError(errorMessage(err)) });
  }

  const rows = payments.data?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            icon={Search}
            placeholder="Search student, receipt no. or reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="py-2.5"
            aria-label="Search payments"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PaymentStatus | "");
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value as PaymentMethod | "");
            setPage(1);
          }}
          aria-label="Filter by method"
        >
          <option value="">All Methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </Select>
        {canRecord && (
          <Button type="button" className="w-auto px-4 py-2.5" onClick={() => setRecording(true)}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        )}
      </div>

      {actionError && (
        <div className="mt-4">
          <FormError message={actionError} />
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
        <table className={cn("w-full min-w-[900px] text-left text-sm", payments.isPlaceholderData && "opacity-60")}>
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Date Paid</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.isPending ? (
              <TableStateRow colSpan={COLUMNS}>
                <LoadingText label="Loading payments..." />
              </TableStateRow>
            ) : payments.isError ? (
              <TableStateRow colSpan={COLUMNS}>
                {errorMessage(payments.error)}
                <RetryButton onRetry={() => payments.refetch()} />
              </TableStateRow>
            ) : rows.length === 0 ? (
              <TableStateRow colSpan={COLUMNS}>No payments match your filters.</TableStateRow>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className={TABLE_ROW}>
                  <td className="px-4 py-3 text-slate-gray">{formatDate(p.paidAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary-navy">{p.studentName}</p>
                    <p className="text-xs text-slate-gray">{p.admissionNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary-navy">{formatNaira(p.amount)}</p>
                    <p className="text-xs text-slate-gray">Balance after: {formatNaira(p.invoiceBalance)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-gray">
                    {PAYMENT_METHOD_LABELS[p.method]}
                    {p.reference && <p className="text-xs">{p.reference}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Pill className={PAYMENT_STATUS_STYLES[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Pill>
                    {p.rejectionReason && <p className="mt-1 max-w-48 text-xs text-slate-gray">{p.rejectionReason}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-gray">{p.receiptNumber ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {p.status === "PENDING" && canVerify && (
                        <>
                          <IconAction
                            icon={CheckCircle2}
                            label="Verify payment and issue receipt"
                            onClick={() => verifyPayment(p)}
                            disabledReason={verify.isPending ? "Verifying..." : null}
                          />
                          <IconAction icon={XCircle} label="Reject payment" tone="danger" onClick={() => setRejecting(p)} />
                        </>
                      )}
                      {p.status === "VERIFIED" && (
                        <IconAction icon={ReceiptIcon} label="View receipt" onClick={() => setReceiptFor(p.id)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <PaginationFooter meta={payments.data?.meta} noun="payments" onPageChange={setPage} />
      </div>

      {recording && <RecordPaymentModal onClose={closeRecording} />}
      {receiptFor && <ReceiptModal paymentId={receiptFor} onClose={() => setReceiptFor(null)} />}
      {rejecting && (
        <ReasonModal
          title="Reject Payment"
          description={
            <>
              Reject {formatNaira(rejecting.amount)} recorded for{" "}
              <span className="font-semibold text-primary-navy">{rejecting.studentName}</span>? It won&apos;t count
              towards their balance.
            </>
          }
          confirmLabel="Reject Payment"
          tone="danger"
          onConfirm={({ reason }) => reject.mutateAsync({ id: rejecting.id, reason })}
          onClose={() => setRejecting(null)}
        />
      )}
    </div>
  );
}
