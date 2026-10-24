"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { LoadingText, Pill, RetryButton, TABLE_HEAD_ROW, TABLE_ROW } from "@/components/ui/table";
import { TERM_LABELS } from "@/components/academics/setup/shared";
import { errorMessage } from "@/lib/api-client";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_STYLES } from "@/lib/finance-labels";
import { useTerms } from "@/lib/queries/academics";
import { useReportCard, useStudentAttendance, useStudentStatement } from "@/lib/queries/student-records";
import { useCan } from "@/lib/store/auth-store";
import { cn, formatDate, formatNaira } from "@/lib/utils";
import type { AttendanceStatus } from "@/types/attendance";

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 rounded-xl border border-slate-gray/10 bg-white p-5">{children}</div>;
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-gray">{children}</p>;
}

/** Term picker across sessions, starting on the current term. */
function useTermPicker() {
  const terms = useTerms();
  const list = terms.data?.data ?? [];
  const [picked, setPicked] = useState<string | null>(null);
  const termId = picked ?? list.find((t) => t.isCurrent)?.id ?? list[list.length - 1]?.id;
  const picker = (
    <Select value={termId ?? ""} onChange={(e) => setPicked(e.target.value)} aria-label="Term" disabled={list.length === 0}>
      {list.length === 0 && <option value="">No terms yet</option>}
      {list.map((t) => (
        <option key={t.id} value={t.id}>
          {TERM_LABELS[t.name]}, {t.sessionName}
          {t.isCurrent ? " (current)" : ""}
        </option>
      ))}
    </Select>
  );
  return { termId, picker };
}

const MARK_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-red-100 text-red-700",
  EXCUSED: "bg-cloud-sky text-bright-blue",
};

/** Attendance tab: the term's summary and every register entry for this student. */
export function StudentAttendanceTab({ studentId }: { studentId: string }) {
  const canRead = useCan("attendance.read");
  const { termId, picker } = useTermPicker();
  const attendance = useStudentAttendance(studentId, termId, canRead);
  const data = attendance.data;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-primary-navy">Attendance</h2>
        {picker}
      </div>
      {!canRead ? (
        <Message>You don&apos;t have access to attendance records.</Message>
      ) : !termId ? (
        <Message>No terms have been set up yet.</Message>
      ) : attendance.isPending ? (
        <Message>
          <LoadingText label="Loading attendance..." />
        </Message>
      ) : attendance.isError ? (
        <Message>
          {errorMessage(attendance.error)}
          <RetryButton onRetry={() => attendance.refetch()} />
        </Message>
      ) : !data || data.records.length === 0 ? (
        <Message>No registers have included this student in that term.</Message>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Rate", `${Math.round(data.summary.rate)}%`],
              ["Days", data.summary.daysOpen],
              ["Present", data.summary.present - data.summary.late],
              ["Late", data.summary.late],
              ["Absent", data.summary.absent],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-cloud-sky/30 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">{label}</p>
                <p className="text-lg font-bold text-primary-navy">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className={TABLE_HEAD_ROW}>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Mark</th>
                  <th className="px-3 py-2.5">Note</th>
                </tr>
              </thead>
              <tbody>
                {[...data.records].reverse().map((r) => (
                  <tr key={r.date} className={TABLE_ROW}>
                    <td className="px-3 py-2.5 text-slate-gray">{formatDate(r.date)}</td>
                    <td className="px-3 py-2.5">
                      <Pill className={MARK_STYLES[r.status]}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Pill>
                    </td>
                    <td className="px-3 py-2.5 text-slate-gray">{r.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}

/** Finance tab: the fee statement, invoices and the running-balance ledger. */
export function StudentFinanceTab({ studentId }: { studentId: string }) {
  const canRead = useCan("finance.read");
  const statement = useStudentStatement(studentId, canRead);
  const s = statement.data;

  if (!canRead) return <Panel><Message>You don&apos;t have access to fees.</Message></Panel>;
  if (statement.isPending) return <Panel><Message><LoadingText label="Loading fee statement..." /></Message></Panel>;
  if (statement.isError || !s) {
    return (
      <Panel>
        <Message>
          {errorMessage(statement.error)}
          <RetryButton onRetry={() => statement.refetch()} />
        </Message>
      </Panel>
    );
  }
  if (s.invoices.length === 0) return <Panel><Message>No fees have been billed to this student yet.</Message></Panel>;

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Billed", s.totalBilled],
          ["Discounts", s.totalDiscounted],
          ["Waived", s.totalWaived],
          ["Paid", s.totalPaid],
          ["Balance", s.closingBalance],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-gray/10 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">{label}</p>
            <p className={cn("text-lg font-bold", label === "Balance" && Number(value) > 0 ? "text-red-600" : "text-primary-navy")}>
              {formatNaira(Number(value))}
            </p>
          </div>
        ))}
      </div>
      {s.pendingVerification > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-primary-navy">
          {formatNaira(s.pendingVerification)} recorded but awaiting verification; it isn&apos;t in the balance yet.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
        <h2 className="px-5 pt-4 text-sm font-bold text-primary-navy">Invoices</h2>
        <table className="mt-2 w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-5 py-2.5">Fee</th>
              <th className="px-5 py-2.5">Billed</th>
              <th className="px-5 py-2.5">Paid</th>
              <th className="px-5 py-2.5">Balance</th>
              <th className="px-5 py-2.5">Due</th>
              <th className="px-5 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {s.invoices.map((inv) => (
              <tr key={inv.id} className={TABLE_ROW}>
                <td className="px-5 py-2.5 font-semibold text-primary-navy">{inv.structureName}</td>
                <td className="px-5 py-2.5 text-slate-gray">{formatNaira(inv.totalAmount - inv.discountAmount)}</td>
                <td className="px-5 py-2.5 text-slate-gray">{formatNaira(inv.amountPaid)}</td>
                <td className="px-5 py-2.5 font-semibold text-primary-navy">{formatNaira(inv.balance)}</td>
                <td className="px-5 py-2.5 text-slate-gray">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                <td className="px-5 py-2.5">
                  <Pill className={INVOICE_STATUS_STYLES[inv.status]}>{INVOICE_STATUS_LABELS[inv.status]}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
        <h2 className="px-5 pt-4 text-sm font-bold text-primary-navy">Ledger</h2>
        <table className="mt-2 w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-5 py-2.5">Date</th>
              <th className="px-5 py-2.5">Description</th>
              <th className="px-5 py-2.5 text-right">Charge</th>
              <th className="px-5 py-2.5 text-right">Credit</th>
              <th className="px-5 py-2.5 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {s.ledger.map((entry, i) => (
              <tr key={`${entry.date}-${i}`} className={TABLE_ROW}>
                <td className="px-5 py-2.5 text-slate-gray">{formatDate(entry.date)}</td>
                <td className="px-5 py-2.5 text-primary-navy">
                  {entry.description}
                  {entry.reference && <span className="ml-1.5 text-xs text-slate-gray">({entry.reference})</span>}
                </td>
                <td className="px-5 py-2.5 text-right text-slate-gray">{entry.debit ? formatNaira(entry.debit) : ""}</td>
                <td className="px-5 py-2.5 text-right text-green-700">{entry.credit ? formatNaira(entry.credit) : ""}</td>
                <td className="px-5 py-2.5 text-right font-semibold text-primary-navy">{formatNaira(entry.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Results tab: the report card for a term (only once the class's results are computed). */
export function StudentResultsTab({ studentId }: { studentId: string }) {
  const canRead = useCan("results.read");
  const { termId, picker } = useTermPicker();
  const card = useReportCard(studentId, termId, canRead);
  const r = card.data;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-primary-navy">Results</h2>
        {picker}
      </div>
      {!canRead ? (
        <Message>You don&apos;t have access to results.</Message>
      ) : !termId ? (
        <Message>No terms have been set up yet.</Message>
      ) : card.isPending ? (
        <Message>
          <LoadingText label="Loading report card..." />
        </Message>
      ) : card.isError ? (
        <Message>
          {errorMessage(card.error)}
          <RetryButton onRetry={() => card.refetch()} />
        </Message>
      ) : !r ? (
        <Message>No results have been computed for this student in that term.</Message>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Average", `${r.averageScore.toFixed(1)}%`],
              ["Position", r.positionLabel ? `${r.positionLabel} of ${r.outOf}` : "—"],
              ["Passes", `${r.passes} of ${r.subjectCount}`],
              ["Status", r.status.charAt(0) + r.status.slice(1).toLowerCase()],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-cloud-sky/30 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">{label}</p>
                <p className="text-lg font-bold text-primary-navy">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className={TABLE_HEAD_ROW}>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5">Total</th>
                  <th className="px-3 py-2.5">Grade</th>
                  <th className="px-3 py-2.5">Position</th>
                  <th className="px-3 py-2.5">Remark</th>
                </tr>
              </thead>
              <tbody>
                {r.subjects.map((sub) => (
                  <tr key={sub.subjectName} className={TABLE_ROW}>
                    <td className="px-3 py-2.5 font-semibold text-primary-navy">{sub.subjectName}</td>
                    <td className="px-3 py-2.5 text-slate-gray">{sub.total}</td>
                    <td className="px-3 py-2.5 text-slate-gray">{sub.grade ?? "—"}</td>
                    <td className="px-3 py-2.5 text-slate-gray">{sub.positionLabel ?? "—"}</td>
                    <td className="px-3 py-2.5 text-slate-gray">{sub.remark ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(r.formTeacherComment || r.principalComment) && (
            <div className="mt-4 space-y-2 text-sm">
              {r.formTeacherComment && (
                <p className="text-slate-gray">
                  <span className="font-semibold text-primary-navy">Form teacher:</span> {r.formTeacherComment}
                </p>
              )}
              {r.principalComment && (
                <p className="text-slate-gray">
                  <span className="font-semibold text-primary-navy">Principal:</span> {r.principalComment}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
