import Link from "next/link";
import { AlertTriangle, CircleAlert, type LucideIcon } from "lucide-react";
import type { AttendanceAlert } from "@/types/attendance";

const SEVERITY_STYLES: Record<
  AttendanceAlert["severity"],
  { icon: LucideIcon; iconClass: string; bgClass: string }
> = {
  critical: { icon: CircleAlert, iconClass: "text-red-600", bgClass: "bg-red-50" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-600", bgClass: "bg-amber-50" },
};

/**
 * "Requires Attention" card on the Attendance Reports screen — same
 * icon-chip-plus-text pattern as the Dashboard's Needs Attention card.
 * "View Students"/"View Class" both fall back to the Students list for
 * now, same spirit as other "falls back to X until the real target
 * exists" links elsewhere in the app.
 */
export function AttendanceAlertsCard({ alerts }: { alerts: AttendanceAlert[] }) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">Requires Attention</h2>
      <div className="mt-3 space-y-2.5">
        {alerts.map((alert) => {
          const { icon: Icon, iconClass, bgClass } = SEVERITY_STYLES[alert.severity];
          return (
            <div key={alert.id} className={`flex gap-2.5 rounded-lg p-3 ${bgClass}`}>
              <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
              <div>
                <p className="text-xs font-semibold text-primary-navy">{alert.title}</p>
                <p className="mt-0.5 text-xs text-slate-gray">{alert.description}</p>
                <Link
                  href={alert.actionHref}
                  className={`mt-1.5 inline-block text-xs font-semibold hover:underline ${iconClass}`}
                >
                  {alert.actionLabel}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}