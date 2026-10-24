"use client";

import { useEntityActivity } from "@/lib/queries/student-records";
import { useCan } from "@/lib/store/auth-store";
import { formatRelativeTime } from "@/lib/utils";

/** "student.status.changed" -> "Student status changed", when an entry has no description. */
function describe(action: string, description: string | null) {
  if (description) return description;
  const words = action.replaceAll(".", " ").replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * "Recent Activity" card on the Student Profile Overview tab: this student's own audit
 * trail (admission, edits, status changes, promotions), not the school-wide feed.
 * Hidden for users without audit.read.
 */
export function StudentRecentActivityCard({ studentId }: { studentId: string }) {
  const canRead = useCan("audit.read");
  const activity = useEntityActivity("Student", studentId, 6, canRead);
  if (!canRead) return null;
  const entries = activity.data?.data ?? [];

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">Recent Activity</h2>

      {activity.isPending ? (
        <p className="mt-3 text-xs text-slate-gray">Loading...</p>
      ) : activity.isError ? (
        <p className="mt-3 text-xs text-slate-gray">Couldn&apos;t load activity.</p>
      ) : entries.length === 0 ? (
        <p className="mt-3 text-xs text-slate-gray">No recent activity for this student yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bright-blue" />
              <p className="text-xs text-primary-navy">
                {describe(entry.action, entry.description)}
                <span className="ml-1.5 text-slate-gray">
                  {formatRelativeTime(entry.createdAt)}
                  {entry.actor && ` · ${entry.actor.firstName} ${entry.actor.lastName}`}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
