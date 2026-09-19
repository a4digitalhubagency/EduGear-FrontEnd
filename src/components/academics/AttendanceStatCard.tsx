import type { LucideIcon } from "lucide-react";

interface AttendanceStatCardProps {
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
  label: string;
  value: string;
  caption?: string;
  captionClass?: string;
}

/**
 * Lightweight stat tile for the Attendance Reports screen — same visual
 * language as the Dashboard's StatCard (icon chip, label, big value,
 * small caption) but without its trend-badge/progress-bar options, which
 * don't apply to this screen's simpler "value + caption" cards.
 */
export function AttendanceStatCard({
  icon: Icon,
  iconClass,
  bgClass,
  label,
  value,
  caption,
  captionClass = "text-slate-gray",
}: AttendanceStatCardProps) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <p className="mt-3 text-xs text-slate-gray">{label}</p>
      <p className="text-xl font-bold text-primary-navy">{value}</p>
      {caption && <p className={`mt-1 text-xs font-semibold ${captionClass}`}>{caption}</p>}
    </div>
  );
}