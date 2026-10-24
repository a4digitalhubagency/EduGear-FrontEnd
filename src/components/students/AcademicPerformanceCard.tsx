"use client";

import { useReportCard } from "@/lib/queries/student-records";
import { useCan } from "@/lib/store/auth-store";

interface AcademicPerformanceCardProps {
  studentId: string;
  termId: string | undefined;
  termLabel: string | undefined;
}

/** "Academic Performance" card on the Student Profile Overview tab, from the term's report card. */
export function AcademicPerformanceCard({ studentId, termId, termLabel }: AcademicPerformanceCardProps) {
  const canRead = useCan("results.read");
  const card = useReportCard(studentId, termId, canRead);
  const r = card.data;

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-gray">Academic Performance</p>
        {termLabel && (
          <span className="rounded-full bg-cloud-sky px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bright-blue">
            {termLabel}
          </span>
        )}
      </div>

      {!canRead ? (
        <p className="mt-2 text-xs text-slate-gray">No access to results.</p>
      ) : !termId ? (
        <p className="mt-2 text-xs text-slate-gray">No current term set.</p>
      ) : card.isPending ? (
        <p className="mt-2 text-xs text-slate-gray">Loading...</p>
      ) : card.isError ? (
        <p className="mt-2 text-xs text-slate-gray">Couldn&apos;t load results.</p>
      ) : !r ? (
        <p className="mt-2 text-xs text-slate-gray">No results computed for this term yet.</p>
      ) : (
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-primary-navy">{r.averageScore.toFixed(1)}%</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-gray">
              Average · {r.subjectCount} subjects
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-primary-navy">
              {r.positionLabel ? `${r.positionLabel} of ${r.outOf}` : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-gray">Position</p>
          </div>
        </div>
      )}
    </div>
  );
}
