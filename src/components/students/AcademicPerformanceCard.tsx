import type { StudentAcademicPerformance } from "@/types/student";

/** "Academic Performance" card on the Student Profile Overview tab. */
export function AcademicPerformanceCard({
  performance,
}: {
  performance: StudentAcademicPerformance;
}) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-gray">
          Academic Performance
        </p>
        <span className="rounded-full bg-cloud-sky px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bright-blue">
          {performance.term}
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-primary-navy">{performance.average}%</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-gray">Average</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-primary-navy">{performance.position}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-gray">Position</p>
        </div>
      </div>
    </div>
  );
}