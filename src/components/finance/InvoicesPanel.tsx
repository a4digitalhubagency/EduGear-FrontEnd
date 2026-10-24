"use client";

import { useState } from "react";
import { Ban, BadgePercent, FilePlus2, HandCoins, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
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
import { AssignInvoicesModal } from "@/components/finance/AssignInvoicesModal";
import { ReasonModal } from "@/components/finance/ReasonModal";
import { errorMessage } from "@/lib/api-client";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_STYLES } from "@/lib/finance-labels";
import { useDebouncedValue } from "@/lib/hooks";
import { useClassArms } from "@/lib/queries/academics";
import { useAdjustInvoice, useInvoices } from "@/lib/queries/finance";
import { useCan } from "@/lib/store/auth-store";
import { cn, formatDate, formatNaira } from "@/lib/utils";
import { INVOICE_STATUSES, type Invoice, type InvoiceStatus } from "@/types/finance";

const COLUMNS = 8;

type Adjusting = { invoice: Invoice; kind: "discount" | "waive" | "cancel" };

const ADJUST_COPY = {
  discount: { title: "Discount Invoice", confirm: "Apply Discount" },
  waive: { title: "Waive Invoice", confirm: "Waive Balance" },
  cancel: { title: "Cancel Invoice", confirm: "Cancel Invoice" },
} as const;

/** Invoices tab: every student fee for the session, with issue / discount / waive / cancel. */
export function InvoicesPanel({ sessionId }: { sessionId: string | undefined }) {
  const canIssue = useCan("finance.create");
  const canAdjust = useCan("finance.update");
  const arms = useClassArms();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [classArmId, setClassArmId] = useState("");
  const [owingOnly, setOwingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search);

  const invoices = useInvoices({
    page,
    limit: 20,
    sessionId,
    search: debounced.trim() || undefined,
    status: status || undefined,
    classArmId: classArmId || undefined,
    owing: owingOnly || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const adjust = useAdjustInvoice();

  const [issuing, setIssuing] = useState(false);
  const [adjusting, setAdjusting] = useState<Adjusting | null>(null);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const rows = invoices.data?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            icon={Search}
            placeholder="Search student name or admission no..."
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            className="py-2.5"
            aria-label="Search invoices"
          />
        </div>
        <Select value={classArmId} onChange={(e) => resetPage(setClassArmId)(e.target.value)} aria-label="Filter by class arm">
          <option value="">All Arms</option>
          {(arms.data?.data ?? []).map((arm) => (
            <option key={arm.id} value={arm.id}>
              {arm.fullName}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => resetPage(setStatus)(e.target.value as InvoiceStatus | "")}
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {INVOICE_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Checkbox label="Still owing" checked={owingOnly} onChange={(e) => resetPage(setOwingOnly)(e.target.checked)} />
        {canIssue && (
          <Button type="button" className="w-auto px-4 py-2.5" onClick={() => setIssuing(true)}>
            <FilePlus2 className="h-4 w-4" />
            Issue Invoices
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
        <table className={cn("w-full min-w-[960px] text-left text-sm", invoices.isPlaceholderData && "opacity-60")}>
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Payable</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.isPending ? (
              <TableStateRow colSpan={COLUMNS}>
                <LoadingText label="Loading invoices..." />
              </TableStateRow>
            ) : invoices.isError ? (
              <TableStateRow colSpan={COLUMNS}>
                {errorMessage(invoices.error)}
                <RetryButton onRetry={() => invoices.refetch()} />
              </TableStateRow>
            ) : rows.length === 0 ? (
              <TableStateRow colSpan={COLUMNS}>No invoices match your filters.</TableStateRow>
            ) : (
              rows.map((inv) => {
                const open = inv.status === "UNPAID" || inv.status === "PARTIAL";
                const overdue = open && inv.dueDate && new Date(inv.dueDate) < new Date();
                return (
                  <tr key={inv.id} className={TABLE_ROW}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-primary-navy">{inv.studentName}</p>
                      <p className="text-xs text-slate-gray">
                        {inv.admissionNumber}
                        {inv.className ? ` · ${inv.className}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-gray">{inv.structureName}</td>
                    <td className="px-4 py-3 text-slate-gray">
                      {formatNaira(inv.payableAmount)}
                      {inv.discountAmount > 0 && (
                        <p className="text-xs text-green-700">− {formatNaira(inv.discountAmount)} discount</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-gray">{formatNaira(inv.amountPaid)}</td>
                    <td className="px-4 py-3 font-semibold text-primary-navy">{formatNaira(inv.balance)}</td>
                    <td className={cn("px-4 py-3", overdue ? "font-semibold text-red-600" : "text-slate-gray")}>
                      {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                      {overdue && <p className="text-xs font-medium">Overdue</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Pill className={INVOICE_STATUS_STYLES[inv.status]}>{INVOICE_STATUS_LABELS[inv.status]}</Pill>
                      {inv.waiverReason && <p className="mt-1 max-w-44 text-xs text-slate-gray">{inv.waiverReason}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canAdjust && open && (
                          <>
                            <IconAction icon={BadgePercent} label="Apply a discount" onClick={() => setAdjusting({ invoice: inv, kind: "discount" })} />
                            <IconAction icon={HandCoins} label="Waive (write off) the balance" onClick={() => setAdjusting({ invoice: inv, kind: "waive" })} />
                            <IconAction
                              icon={Ban}
                              label="Cancel invoice (raised in error)"
                              tone="danger"
                              onClick={() => setAdjusting({ invoice: inv, kind: "cancel" })}
                              disabledReason={inv.amountPaid > 0 ? "It has payments against it. Reject those payments before cancelling." : null}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <PaginationFooter meta={invoices.data?.meta} noun="invoices" onPageChange={setPage} />
      </div>

      {issuing && <AssignInvoicesModal sessionId={sessionId} onClose={() => setIssuing(false)} />}
      {adjusting && (
        <ReasonModal
          title={ADJUST_COPY[adjusting.kind].title}
          description={
            <>
              {adjusting.invoice.structureName} for{" "}
              <span className="font-semibold text-primary-navy">{adjusting.invoice.studentName}</span>, balance{" "}
              {formatNaira(adjusting.invoice.balance)}.
              {adjusting.kind === "waive" && " The remaining balance will be written off."}
              {adjusting.kind === "cancel" && " Use this only for an invoice raised in error."}
            </>
          }
          confirmLabel={ADJUST_COPY[adjusting.kind].confirm}
          tone={adjusting.kind === "discount" ? "primary" : "danger"}
          // A discount replaces the invoice's discount (it isn't added on), up to what was billed.
          amountMax={adjusting.kind === "discount" ? adjusting.invoice.totalAmount : undefined}
          amountDefault={adjusting.invoice.discountAmount}
          amountLabel="Total Discount (₦) *"
          amountHint={`Replaces any existing discount. Billed: ${formatNaira(adjusting.invoice.totalAmount)}. Enter 0 to remove it.`}
          onConfirm={({ reason, amount }) =>
            adjust.mutateAsync({
              id: adjusting.invoice.id,
              adjustment: adjusting.kind === "discount" ? { kind: "discount", amount, reason } : { kind: adjusting.kind, reason },
            })
          }
          onClose={() => setAdjusting(null)}
        />
      )}
    </div>
  );
}
