import type { StudentActivityEntry } from "@/types/student";

/** "Recent Activity" card on the Student Profile Overview tab — this student's own activity, not the school-wide feed on the Dashboard. */
export function StudentRecentActivityCard({ activity }: { activity: StudentActivityEntry[] }) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">Recent Activity</h2>

      {activity.length === 0 ? (
        <p className="mt-3 text-xs text-slate-gray">No recent activity for this student yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {activity.map((item) => (
            <li key={`${item.label}-${item.detail}`} className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bright-blue" />
              <p className="text-xs text-primary-navy">
                {item.label}
                <span className="ml-1.5 text-slate-gray">{item.detail}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}