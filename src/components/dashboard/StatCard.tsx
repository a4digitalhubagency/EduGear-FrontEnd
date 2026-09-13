import type { LucideIcon } from "lucide-react";
import { Minus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeTone = "positive" | "neutral" | "negative";

interface StatCardProps {
  icon: LucideIcon;
  iconClassName: string;
  badgeText: string;
  badgeTone: BadgeTone;
  label: string;
  value: string;
  /** Small caption under the value, e.g. "ACTIVE REGISTRATIONS" or "ACTION REQUIRED". */
  caption?: string;
  captionTone?: "neutral" | "negative";
  /** Renders a thin progress bar instead of a caption (used by the Fee Collection card). */
  progressPercent?: number;
}

const BADGE_STYLES: Record<BadgeTone, string> = {
  positive: "text-green-600",
  neutral: "text-slate-gray",
  negative: "text-red-600",
};

/**
 * One of the 4 stat cards on "School Administrator Dashboard - Overview":
 * Total Students, Total Staff, Fee Collection, Outstanding Fees.
 */
export function StatCard({
  icon: Icon,
  iconClassName,
  badgeText,
  badgeTone,
  label,
  value,
  caption,
  captionTone = "neutral",
  progressPercent,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={cn("flex items-center gap-1 text-xs font-semibold", BADGE_STYLES[badgeTone])}>
          {badgeTone === "positive" && <TrendingUp className="h-3 w-3" />}
          {badgeTone === "neutral" && <Minus className="h-3 w-3" />}
          {badgeText}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-gray">{label}</p>
      <p className="text-xl font-bold text-primary-navy">{value}</p>

      {progressPercent !== undefined ? (
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-gray/10">
          <div
            className="h-1.5 rounded-full bg-green-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      ) : (
        caption && (
          <p
            className={cn(
              "mt-1.5 text-[10px] font-semibold uppercase tracking-wide",
              captionTone === "negative" ? "text-red-600" : "text-slate-gray/70",
            )}
          >
            {caption}
          </p>
        )
      )}
    </div>
  );
}