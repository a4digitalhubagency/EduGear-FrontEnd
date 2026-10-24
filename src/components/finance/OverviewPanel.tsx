"use client";

import { AlertTriangle, Clock, Coins, Receipt } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { LoadingText, RetryButton, TABLE_HEAD_ROW, TABLE_ROW } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance-labels";
import { useFinanceSummary } from "@/lib/queries/finance";
import { formatNaira } from "@/lib/utils";

/** Overview tab: the collection report for the selected session (GET /finance/reports/summary). */
export function OverviewPanel({ sessionId }: { sessionId: string | undefined }) {
  const summary = useFinanceSummary({ sessionId });

  if (summary.isPending) {
    return (
      <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
        <LoadingText label="Loading finance summary..." />
      </div>
    );
  }
  if (summary.isError) {
    return (
      <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
        {errorMessage(summary.error)}
        <RetryButton onRetry={() => summary.refetch()} />
      </div>
    );
  }

  const s = summary.data;
  const hasBilling = s.totalPayable > 0;
  const methodsTotal = s.byMethod.reduce((sum, m) => sum + m.total, 0);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Receipt}
          iconClassName="bg-blue-100 text-blue-700"
          index={0}
          label="Total Payable"
          value={formatNaira(s.totalPayable)}
          caption={`${s.invoiceCount.toLocaleString()} invoices · ${s.studentCount.toLocaleString()} students`}
        />
        <StatCard
          icon={Coins}
          iconClassName="bg-green-100 text-green-700"
          badgeText={hasBilling ? `${Math.round(s.collectionRate)}% collected` : undefined}
          badgeTone="positive"
          index={1}
          label="Collected (verified)"
          value={formatNaira(s.totalCollected)}
          progressPercent={hasBilling ? s.collectionRate : undefined}
          caption={hasBilling ? undefined : "No Invoices Yet"}
        />
        <StatCard
          icon={AlertTriangle}
          iconClassName="bg-red-100 text-red-700"
          index={2}
          label="Outstanding"
          value={formatNaira(s.totalOutstanding)}
          caption={`${s.debtorCount.toLocaleString()} invoices still owing`}
          captionTone={s.totalOutstanding > 0 ? "negative" : "neutral"}
        />
        <StatCard
          icon={Clock}
          iconClassName="bg-amber-100 text-amber-700"
          index={3}
          label="Awaiting Verification"
          value={formatNaira(s.pendingVerification)}
          caption="Recorded, not yet counted"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-x-auto rounded-xl border border-slate-gray/10 bg-white lg:col-span-2">
          <div className="px-5 pt-5">
            <h2 className="text-sm font-bold text-primary-navy">Collected by Payment Method</h2>
            <p className="text-xs text-slate-gray">Verified payments only.</p>
          </div>
          {s.byMethod.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-gray">No verified payments yet.</p>
          ) : (
            <table className="mt-3 w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className={TABLE_HEAD_ROW}>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Payments</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Share</th>
                </tr>
              </thead>
              <tbody>
                {s.byMethod.map((m) => {
                  const share = methodsTotal > 0 ? Math.round((m.total / methodsTotal) * 100) : 0;
                  return (
                    <tr key={m.method} className={TABLE_ROW}>
                      <td className="px-5 py-3 font-semibold text-primary-navy">{PAYMENT_METHOD_LABELS[m.method] ?? m.method}</td>
                      <td className="px-5 py-3 text-slate-gray">{m.count.toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-gray">{formatNaira(m.total)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-slate-gray/10">
                            <div className="h-1.5 origin-left animate-grow-x rounded-full bg-bright-blue" style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-xs text-slate-gray">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
          <h2 className="text-sm font-bold text-primary-navy">Billing Breakdown</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-gray">Billed</dt>
              <dd className="font-semibold text-primary-navy">{formatNaira(s.totalBilled)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-gray">Discounts</dt>
              <dd className="font-semibold text-primary-navy">− {formatNaira(s.totalDiscounted)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-gray/10 pt-2">
              <dt className="text-slate-gray">Payable</dt>
              <dd className="font-semibold text-primary-navy">{formatNaira(s.totalPayable)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-gray">Collected</dt>
              <dd className="font-semibold text-green-700">− {formatNaira(s.totalCollected)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-gray/10 pt-2">
              <dt className="text-slate-gray">Outstanding</dt>
              <dd className="font-bold text-red-600">{formatNaira(s.totalOutstanding)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
