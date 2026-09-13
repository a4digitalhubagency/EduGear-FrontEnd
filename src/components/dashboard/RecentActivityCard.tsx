interface ActivityItem {
  dotClassName: string;
  title: string;
  detail: string;
}

const ACTIVITY: ActivityItem[] = [
  {
    dotClassName: "bg-blue-500",
    title: "New registration: Chukwuemeka O.",
    detail: "2 mins ago · Primary 4 Gold",
  },
  {
    dotClassName: "bg-green-500",
    title: "Fee payment recorded: ₦20,000",
    detail: "15 mins ago · Fatimah Bello (JSS2)",
  },
  {
    dotClassName: "bg-purple-500",
    title: "Result approval: Mid-term Reports",
    detail: "1 hour ago · SSS 3 Science",
  },
  {
    dotClassName: "bg-amber-500",
    title: "New Announcement: PTA Meeting",
    detail: "3 hours ago · To all parents",
  },
];

/** "Recent Activity" card — timeline of the latest admin actions across the school. */
export function RecentActivityCard() {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-primary-navy">Recent Activity</h2>
        <button type="button" className="text-xs font-semibold text-bright-blue hover:underline">
          View All
        </button>
      </div>

      <ul className="mt-3 space-y-3.5">
        {ACTIVITY.map((item, index) => (
          <li key={item.title} className="relative flex gap-3 pl-1">
            {index < ACTIVITY.length - 1 && (
              <span className="absolute left-[7px] top-4 h-full w-px bg-slate-gray/10" />
            )}
            <span className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.dotClassName}`} />
            <div>
              <p className="text-xs font-semibold text-primary-navy">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-gray">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}