import { cn } from "@/lib/utils";
import type { StudentFinanceSummary } from "@/types/student";

/** "Finance Overview" card on the Student Profile Overview tab. */
export function FinanceOverviewCard({ finance }: { finance: StudentFinanceSummary }) {
  const isFullyPaid = finance.status === "Fully Paid";

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-gray">
          Finance Overview
        </p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            isFullyPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
          )}
        >
          {finance.status}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-primary-navy">
        {finance.paid}{" "}
        <span className="font-normal text-slate-gray">/ {finance.totalFee}</span>
      </p>
      <p className="text-[10px] uppercase tracking-wide text-slate-gray">Total / Paid</p>

      <p
        className={cn(
          "mt-2 text-sm font-semibold",
          isFullyPaid ? "text-primary-navy" : "text-red-600",
        )}
      >
        {finance.balance}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-slate-gray">Balance</p>
    </div>
  );
}