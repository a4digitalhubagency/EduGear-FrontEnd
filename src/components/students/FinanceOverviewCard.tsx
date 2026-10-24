"use client";

import { useStudentStatement } from "@/lib/queries/student-records";
import { useCan } from "@/lib/store/auth-store";
import { cn, formatNaira } from "@/lib/utils";

/** "Finance Overview" card on the Student Profile Overview tab, from the student's fee statement. */
export function FinanceOverviewCard({ studentId }: { studentId: string }) {
  const canRead = useCan("finance.read");
  const statement = useStudentStatement(studentId, canRead);
  const s = statement.data;
  const payable = s ? s.totalBilled - s.totalDiscounted - s.totalWaived : 0;
  const settled = !!s && s.closingBalance <= 0;

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-gray">Finance Overview</p>
        {s && s.invoices.length > 0 && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              settled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
            )}
          >
            {settled ? "Fully Paid" : "Balance Due"}
          </span>
        )}
      </div>

      {!canRead ? (
        <p className="mt-2 text-xs text-slate-gray">No access to fees.</p>
      ) : statement.isPending ? (
        <p className="mt-2 text-xs text-slate-gray">Loading...</p>
      ) : statement.isError || !s ? (
        <p className="mt-2 text-xs text-slate-gray">Couldn&apos;t load fees.</p>
      ) : s.invoices.length === 0 ? (
        <p className="mt-2 text-xs text-slate-gray">No fees billed yet.</p>
      ) : (
        <>
          <p className="mt-2 text-sm font-semibold text-primary-navy">
            {formatNaira(s.totalPaid)} <span className="font-normal text-slate-gray">/ {formatNaira(payable)}</span>
          </p>
          <p className="text-[10px] uppercase tracking-wide text-slate-gray">Paid / Payable</p>

          <p className={cn("mt-2 text-sm font-semibold", settled ? "text-primary-navy" : "text-red-600")}>
            {formatNaira(s.closingBalance)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-slate-gray">
            Balance{s.pendingVerification > 0 ? ` · ${formatNaira(s.pendingVerification)} awaiting verification` : ""}
          </p>
        </>
      )}
    </div>
  );
}
