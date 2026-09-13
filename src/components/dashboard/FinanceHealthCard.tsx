import { TrendingUp } from "lucide-react";

const LEGEND = [
  { label: "Collected", amount: "₦42,800,000", dotClassName: "bg-green-500" },
  { label: "Outstanding", amount: "₦12,450,000", dotClassName: "bg-amber-500" },
  { label: "Overdue", amount: "₦7,650,000", dotClassName: "bg-red-500" },
];

/**
 * "Finance Health" card. The sparkline below the legend is a decorative,
 * illustrative trend line (no real weekly data behind it) — the design
 * doesn't label its axis either.
 */
export function FinanceHealthCard() {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">Finance Health</h2>

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">
        Current Collections
      </p>
      <div className="mt-1 flex items-baseline justify-between">
        <p className="text-2xl font-bold text-primary-navy">68%</p>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-xs font-semibold text-green-600">
            <TrendingUp className="h-3 w-3" />
            +12%
          </p>
          <p className="text-[10px] text-slate-gray">vs Last Term</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-gray">
              <span className={`h-1.5 w-1.5 rounded-full ${item.dotClassName}`} />
              {item.label}
            </span>
            <span className="font-semibold text-primary-navy">{item.amount}</span>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 200 60" className="mt-4 h-14 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="finance-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#004ED1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#004ED1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,45 C25,55 40,50 55,35 C70,20 85,40 100,32 C115,24 130,10 150,15 C170,20 185,8 200,5 L200,60 L0,60 Z"
          fill="url(#finance-sparkline-fill)"
        />
        <path
          d="M0,45 C25,55 40,50 55,35 C70,20 85,40 100,32 C115,24 130,10 150,15 C170,20 185,8 200,5"
          fill="none"
          stroke="#004ED1"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}