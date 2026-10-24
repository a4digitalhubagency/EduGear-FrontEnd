import type { CollectionReport } from "@/types/finance";
import { formatNaira } from "@/lib/utils";

interface FinanceHealthCardProps {
  summary: CollectionReport | undefined;
  isError: boolean;
}

/**
 * "Finance Health" card on the finance summary (current session). The design's
 * "vs Last Term" trend and decorative sparkline are gone: there's no history
 * endpoint behind them. In their place, a bar splitting what's payable into
 * collected and still outstanding. "Overdue" became "Awaiting verification",
 * which the summary does report: payments recorded but not yet confirmed.
 */
export function FinanceHealthCard({ summary, isError }: FinanceHealthCardProps) {
  const legend = summary
    ? [
        { label: "Collected", amount: summary.totalCollected, dotClassName: "bg-green-500" },
        { label: "Outstanding", amount: summary.totalOutstanding, dotClassName: "bg-amber-500" },
        { label: "Awaiting verification", amount: summary.pendingVerification, dotClassName: "bg-slate-gray" },
      ]
    : [];
  const collectedShare = summary && summary.totalPayable > 0 ? (summary.totalCollected / summary.totalPayable) * 100 : 0;

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">Finance Health</h2>

      {isError ? (
        <p className="mt-3 text-sm text-slate-gray">Couldn&apos;t load finance figures. Refresh to try again.</p>
      ) : !summary ? (
        <p className="mt-3 text-sm text-slate-gray">Loading...</p>
      ) : summary.invoiceCount === 0 ? (
        <p className="mt-3 text-sm text-slate-gray">No invoices issued this session yet.</p>
      ) : (
        <>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Current Collections</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-primary-navy">{Math.round(summary.collectionRate)}%</p>
            <p className="text-right text-[10px] text-slate-gray">of {formatNaira(summary.totalPayable)} payable</p>
          </div>

          <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-amber-500/80" aria-hidden>
            <div className="h-2 origin-left animate-grow-x bg-green-500" style={{ width: `${Math.min(100, collectedShare)}%` }} />
          </div>

          <div className="mt-3 space-y-1.5">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-gray">
                  <span className={`h-1.5 w-1.5 rounded-full ${item.dotClassName}`} />
                  {item.label}
                </span>
                <span className="font-semibold text-primary-navy">{formatNaira(item.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
