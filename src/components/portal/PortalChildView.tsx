"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, FileText, Receipt as ReceiptIcon, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PrintArea } from "@/components/ui/PrintArea";
import { FormError } from "@/components/ui/FormError";
import { LoadingText, Pill, RetryButton, Tabs } from "@/components/ui/table";
import { ReceiptModal } from "@/components/finance/ReceiptModal";
import { PayOnlineModal, SubmitProofModal } from "@/components/portal/PortalPaymentModals";
import { ReportCardView } from "@/components/results/ReportCardView";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { errorMessage } from "@/lib/api-client";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_STYLES, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "@/lib/finance-labels";
import { usePortalAttendance, usePortalChild, usePortalFees, usePortalReportCard, usePortalResultTerms, useRefreshOnlinePayment } from "@/lib/queries/portal";
import { cn, formatDate, formatNaira } from "@/lib/utils";
import type { AttendanceStatus } from "@/types/attendance";

const CHILD_TABS = ["Overview", "Fees", "Results", "Attendance"] as const;
type ChildTab = (typeof CHILD_TABS)[number];
const TERM_WORD: Record<string, string> = { FIRST: "First", SECOND: "Second", THIRD: "Third" };
const term = (name: string) => `${TERM_WORD[name] ?? name} Term`;

function Card({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-gray/10 bg-white p-4", className)}>
      {title && <h2 className="mb-3 text-sm font-bold text-primary-navy">{title}</h2>}
      {children}
    </div>
  );
}

function State({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-slate-gray/10 bg-white p-8 text-center text-sm text-slate-gray">{children}</p>;
}

function OverviewTab({ studentId }: { studentId: string }) {
  const child = usePortalChild(studentId);
  if (child.isPending) return <State><LoadingText label="Loading..." /></State>;
  if (child.isError) return <State>{errorMessage(child.error)}<RetryButton onRetry={() => child.refetch()} /></State>;
  const c = child.data;
  const a = c.attendance;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card title="Class">
        <p className="font-semibold text-primary-navy">{c.className ?? "Not assigned yet"}</p>
        <p className="text-xs text-slate-gray">Form teacher: {c.formTeacherName ?? "—"}</p>
      </Card>
      <Card title={`Attendance${c.currentTermName ? `, ${term(c.currentTermName)}` : ""}`}>
        {a && a.daysOpen > 0 ? (
          <>
            <p className="text-2xl font-bold text-primary-navy">{Math.round(a.rate)}%</p>
            <p className="text-xs text-slate-gray">
              Present {a.present - a.late} · Late {a.late} · Absent {a.absent} of {a.daysOpen} days
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-gray">No registers taken yet this term.</p>
        )}
      </Card>
      <Card title="Fees">
        <p className={cn("text-2xl font-bold", c.feeBalance > 0 ? "text-red-600" : "text-green-700")}>
          {c.feeBalance > 0 ? formatNaira(c.feeBalance) : "All paid"}
        </p>
        {c.pendingPayments > 0 && <p className="text-xs text-amber-700">{formatNaira(c.pendingPayments)} sent, awaiting confirmation</p>}
      </Card>
      <Card title="Latest Result">
        {c.latestResult ? (
          <>
            <p className="text-2xl font-bold text-primary-navy">{c.latestResult.averageScore.toFixed(1)}%</p>
            <p className="text-xs text-slate-gray">
              {c.latestResult.positionLabel ? `${c.latestResult.positionLabel} of ${c.latestResult.outOf} · ` : ""}
              {term(c.latestResult.termName)}, {c.latestResult.sessionName}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-gray">No results published yet.</p>
        )}
      </Card>
    </div>
  );
}

function FeesTab({ studentId }: { studentId: string }) {
  const fees = usePortalFees(studentId);
  const refresh = useRefreshOnlinePayment();
  const [modal, setModal] = useState<"proof" | "online" | null>(null);
  const [receiptFor, setReceiptFor] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  if (fees.isPending) return <State><LoadingText label="Loading fees..." /></State>;
  if (fees.isError) return <State>{errorMessage(fees.error)}<RetryButton onRetry={() => fees.refetch()} /></State>;
  const s = fees.data;
  const open = s.invoices.filter((i) => (i.status === "UNPAID" || i.status === "PARTIAL") && i.balance > 0);

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Balance</p>
            <p className={cn("text-2xl font-bold", s.closingBalance > 0 ? "text-red-600" : "text-green-700")}>
              {s.closingBalance > 0 ? formatNaira(s.closingBalance) : "All paid"}
            </p>
            {s.pendingVerification > 0 && <p className="text-xs text-amber-700">{formatNaira(s.pendingVerification)} awaiting confirmation by the school</p>}
          </div>
          {open.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="w-auto px-3 py-2" onClick={() => setModal("proof")}>
                <Upload className="h-4 w-4" />
                I&apos;ve Paid
              </Button>
              <Button type="button" className="w-auto px-3 py-2" onClick={() => setModal("online")}>
                <CreditCard className="h-4 w-4" />
                Pay Online
              </Button>
            </div>
          )}
        </div>
      </Card>

      {note && <p className="rounded-lg bg-cloud-sky/40 px-3 py-2 text-sm text-primary-navy">{note}</p>}

      <Card title="Fees">
        {s.invoices.length === 0 ? (
          <p className="text-sm text-slate-gray">No fees have been billed yet.</p>
        ) : (
          <ul className="divide-y divide-slate-gray/10">
            {s.invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary-navy">{inv.structureName}</p>
                  <p className="text-xs text-slate-gray">
                    {formatNaira(inv.totalAmount - inv.discountAmount)}
                    {inv.dueDate ? ` · due ${formatDate(inv.dueDate)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <Pill className={INVOICE_STATUS_STYLES[inv.status]}>{INVOICE_STATUS_LABELS[inv.status]}</Pill>
                  {inv.balance > 0 && <p className="mt-1 text-xs font-semibold text-red-600">{formatNaira(inv.balance)} left</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Payments">
        {s.payments.length === 0 ? (
          <p className="text-sm text-slate-gray">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-slate-gray/10">
            {s.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-navy">{formatNaira(p.amount)}</p>
                  <p className="text-xs text-slate-gray">
                    {PAYMENT_METHOD_LABELS[p.method]} · {formatDate(p.paidAt)}
                  </p>
                  {p.rejectionReason && <p className="text-xs text-red-600">{p.rejectionReason}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Pill className={PAYMENT_STATUS_STYLES[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Pill>
                  {p.status === "VERIFIED" && (
                    <button type="button" onClick={() => setReceiptFor(p.id)} aria-label="View receipt" title="Receipt" className="rounded-md p-1.5 text-slate-gray hover:bg-cloud-sky/60 hover:text-bright-blue">
                      <ReceiptIcon className="h-4 w-4" />
                    </button>
                  )}
                  {p.status === "PENDING" && p.method === "ONLINE" && (
                    <button
                      type="button"
                      title="Check payment status"
                      aria-label="Check payment status"
                      disabled={refresh.isPending}
                      onClick={() => {
                        setNote(null);
                        refresh
                          .mutateAsync({ studentId, paymentId: p.id })
                          .then((r) => setNote(r.status === "VERIFIED" ? "Payment confirmed. Thank you!" : "Not confirmed yet. Please check again in a few minutes."))
                          .catch((err) => setNote(errorMessage(err)));
                      }}
                      className="rounded-md p-1.5 text-slate-gray hover:bg-cloud-sky/60 hover:text-bright-blue disabled:opacity-50"
                    >
                      <RefreshCw className={cn("h-4 w-4", refresh.isPending && "animate-spin")} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {modal === "proof" && <SubmitProofModal studentId={studentId} invoices={open} onClose={() => setModal(null)} />}
      {modal === "online" && <PayOnlineModal studentId={studentId} invoices={open} onClose={() => setModal(null)} />}
      {receiptFor && (
        <ReceiptModal
          paymentId={receiptFor}
          path={`/portal/children/${studentId}/payments/${receiptFor}/receipt`}
          onClose={() => setReceiptFor(null)}
        />
      )}
    </div>
  );
}

function ResultsTab({ studentId }: { studentId: string }) {
  const terms = usePortalResultTerms(studentId);
  const [termId, setTermId] = useState<string | null>(null);
  const card = usePortalReportCard(studentId, termId);

  if (terms.isPending) return <State><LoadingText label="Loading results..." /></State>;
  if (terms.isError) return <State>{errorMessage(terms.error)}<RetryButton onRetry={() => terms.refetch()} /></State>;
  if (terms.data.length === 0) return <State>No results have been published yet. You&apos;ll get a notification when they are.</State>;

  if (termId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setTermId(null)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-gray hover:text-primary-navy">
            <ArrowLeft className="h-4 w-4" />
            All terms
          </button>
          {card.data && (
            <Button type="button" variant="secondary" className="w-auto px-3 py-2" onClick={() => window.print()}>
              Print
            </Button>
          )}
        </div>
        {card.isPending ? (
          <State><LoadingText label="Loading report card..." /></State>
        ) : card.isError ? (
          <FormError message={errorMessage(card.error)} />
        ) : card.data ? (
          <PrintArea className="overflow-hidden rounded-xl border border-slate-gray/10">
            <ReportCardView card={card.data} />
          </PrintArea>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {terms.data.map((t) => (
        <li key={t.termId}>
          <button type="button" onClick={() => setTermId(t.termId)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-gray/10 bg-white p-4 text-left hover:shadow-md">
            <span>
              <span className="block font-semibold text-primary-navy">
                {term(t.termName)}, {t.sessionName}
              </span>
              <span className="text-xs text-slate-gray">
                {t.averageScore.toFixed(1)}% average{t.positionLabel ? ` · ${t.positionLabel} of ${t.outOf}` : ""}
              </span>
            </span>
            <FileText className="h-5 w-5 shrink-0 text-bright-blue" />
          </button>
        </li>
      ))}
    </ul>
  );
}

const MARK_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-red-100 text-red-700",
  EXCUSED: "bg-cloud-sky text-bright-blue",
};

function AttendanceTab({ studentId }: { studentId: string }) {
  const attendance = usePortalAttendance(studentId);
  if (attendance.isPending) return <State><LoadingText label="Loading attendance..." /></State>;
  if (attendance.isError) return <State>{errorMessage(attendance.error)}<RetryButton onRetry={() => attendance.refetch()} /></State>;
  const { summary, records, termName } = attendance.data;

  return (
    <div className="space-y-3">
      <Card title={term(termName)}>
        {summary.daysOpen === 0 ? (
          <p className="text-sm text-slate-gray">No registers taken yet this term.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ["Rate", `${Math.round(summary.rate)}%`],
              ["Present", summary.present - summary.late],
              ["Late", summary.late],
              ["Absent", summary.absent],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 py-2">
                <p className="text-lg font-bold text-primary-navy">{value}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-gray">{label}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
      {records.length > 0 && (
        <Card title="Day by Day">
          <ul className="divide-y divide-slate-gray/10">
            {[...records].reverse().map((r) => (
              <li key={r.date} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-primary-navy">{formatDate(r.date)}</span>
                <span className="flex items-center gap-2">
                  {r.note && <span className="hidden text-xs text-slate-gray sm:inline">{r.note}</span>}
                  <Pill className={MARK_STYLES[r.status]}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Pill>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/** One child: Overview, Fees (pay, send proof, receipts), Results (published report cards), Attendance. */
export function PortalChildView({ studentId }: { studentId: string }) {
  const child = usePortalChild(studentId);
  const [tab, setTab] = useState<ChildTab>("Overview");

  return (
    <div>
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-gray hover:text-primary-navy">
        <ArrowLeft className="h-4 w-4" />
        My children
      </Link>
      {child.data && (
        <div className="mt-3 flex items-center gap-3">
          <StudentAvatar id={child.data.studentId} name={child.data.fullName} photoUrl={child.data.photoUrl} className="h-12 w-12 text-sm" />
          <div>
            <h1 className="text-lg font-bold text-primary-navy">{child.data.fullName}</h1>
            <p className="text-xs text-slate-gray">
              {child.data.className ?? "No class yet"} · {child.data.admissionNumber}
            </p>
          </div>
        </div>
      )}
      <Tabs tabs={CHILD_TABS} active={tab} onChange={setTab} />
      <div className="mt-4">
        {tab === "Overview" ? (
          <OverviewTab studentId={studentId} />
        ) : tab === "Fees" ? (
          <FeesTab studentId={studentId} />
        ) : tab === "Results" ? (
          <ResultsTab studentId={studentId} />
        ) : (
          <AttendanceTab studentId={studentId} />
        )}
      </div>
    </div>
  );
}
