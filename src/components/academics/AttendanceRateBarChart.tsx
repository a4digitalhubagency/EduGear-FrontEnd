import type { AttendanceTrendPoint } from "@/types/attendance";

interface AttendanceRateBarChartProps {
  points: AttendanceTrendPoint[];
  /** Bars at or below this rate render in the reserved "serious" red status color instead of the default series hue. */
  lowThreshold?: number;
  showLabels?: boolean;
  heightClassName?: string;
}

const DEFAULT_BAR_CLASS = "bg-bright-blue";
const LOW_BAR_CLASS = "bg-red-500";

/**
 * Minimal bar chart for attendance-rate trends — plain CSS/flexbox, same
 * approach as the Dashboard's AttendanceOverviewCard, rather than pulling
 * in a charting library for a couple of small in-page charts.
 *
 * A single hue (bright-blue) encodes magnitude by default, since this is
 * one series and color should follow the entity, not double as a second
 * signal. When `lowThreshold` is set (the Weekly Trend chart), bars at or
 * below it switch to the reserved status red instead of a generic
 * "series 2" color, with a small legend line so the flag isn't
 * communicated by color alone. Each bar carries a native `title` tooltip
 * with its exact value — a deliberately lightweight stand-in for a full
 * hover/tooltip component, reasonable at this scale.
 */
export function AttendanceRateBarChart({
  points,
  lowThreshold,
  showLabels = false,
  heightClassName = "h-28",
}: AttendanceRateBarChartProps) {
  const hasLowBars = lowThreshold !== undefined && points.some((point) => point.rate <= lowThreshold);

  return (
    <div>
      <div className={`flex items-end gap-1 ${heightClassName}`}>
        {points.map((point, index) => {
          const isLow = lowThreshold !== undefined && point.rate <= lowThreshold;
          return (
            <div
              key={`${point.label}-${index}`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  title={`${point.label}: ${point.rate}%`}
                  className={`w-full rounded-t-sm transition-colors ${isLow ? LOW_BAR_CLASS : DEFAULT_BAR_CLASS}`}
                  style={{ height: `${Math.max(point.rate, 4)}%` }}
                />
              </div>
              {showLabels && (
                <span className="text-[10px] font-semibold text-slate-gray">{point.label}</span>
              )}
            </div>
          );
        })}
      </div>
      {hasLowBars && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-gray">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Below {lowThreshold}% attendance
        </p>
      )}
    </div>
  );
}