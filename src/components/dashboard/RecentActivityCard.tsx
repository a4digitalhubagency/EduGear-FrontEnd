"use client";

import { useRecentActivity } from "@/lib/queries/audit";
import { useCan } from "@/lib/store/auth-store";
import { formatRelativeTime } from "@/lib/utils";
import type { AuditLog } from "@/types/audit";

// Dot colour by what the entry is about, same palette as the design's timeline.
const DOT_COLORS: Record<string, string> = {
  Student: "bg-blue-500",
  Guardian: "bg-blue-500",
  Payment: "bg-green-500",
  Invoice: "bg-green-500",
  ResultSheet: "bg-purple-500",
};

/** The entry's own description, or its action code made readable: "student.status.changed" → "Student status changed". */
function title(entry: AuditLog) {
  if (entry.description) return entry.description;
  const words = entry.action.replaceAll(".", " ").replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "Recent Activity" card: the five latest audit-log entries (audit.read). */
export function RecentActivityCard() {
  const canRead = useCan("audit.read");
  const activity = useRecentActivity(5, canRead);
  if (!canRead) return null;

  const entries = activity.data ?? [];

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">Recent Activity</h2>

      {activity.isPending ? (
        <p className="mt-3 text-sm text-slate-gray">Loading...</p>
      ) : activity.isError ? (
        <p className="mt-3 text-sm text-slate-gray">Couldn&apos;t load recent activity.</p>
      ) : entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-gray">No activity recorded yet.</p>
      ) : (
        <ul className="mt-3 space-y-3.5">
          {entries.map((entry, index) => (
            <li key={entry.id} className="relative flex gap-3 pl-1">
              {index < entries.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-slate-gray/10" />}
              <span
                className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${DOT_COLORS[entry.entityType ?? ""] ?? "bg-amber-500"}`}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary-navy">{title(entry)}</p>
                <p className="mt-0.5 text-[11px] text-slate-gray">
                  {formatRelativeTime(entry.createdAt)}
                  {entry.actor && ` · ${entry.actor.firstName} ${entry.actor.lastName}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
