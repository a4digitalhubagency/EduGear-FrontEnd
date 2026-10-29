import type { LucideIcon } from "lucide-react";
import { Minus, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";
import { cn } from "@/lib/utils";

type BadgeTone = "positive" | "neutral" | "negative";

interface StatCardProps {
  icon: LucideIcon;
  iconClassName: string;
  /** Optional top-right note, e.g. "324 students". */
  badgeText?: string;
  badgeTone?: BadgeTone;
  label: string;
  value: string;
  /** Small caption under the value, e.g. "ACTIVE REGISTRATIONS" or "ACTION REQUIRED". */
  caption?: string;
  captionTone?: "neutral" | "negative";
  /** Renders a thin progress bar instead of a caption (used by the Fee Collection card). */
  progressPercent?: number;
  /** Position in a row of cards; staggers their entrance by 60ms each. */
  index?: number;
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
  badgeTone = "neutral",
  label,
  value,
  caption,
  captionTone = "neutral",
  progressPercent,
  index = 0,
}: StatCardProps) {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-slate-gray/10 bg-white p-4 transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
        {badgeText && (
          <span className={cn("flex items-center gap-1 text-xs font-semibold", BADGE_STYLES[badgeTone])}>
            {badgeTone === "positive" && <TrendingUp className="h-3 w-3" />}
            {badgeTone === "neutral" && <Minus className="h-3 w-3" />}
            {badgeText}
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-gray">{label}</p>
      <p className="text-xl font-bold text-primary-navy">
        <CountUp value={value} />
      </p>

      {progressPercent !== undefined ? (
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-gray/10">
          <div
            // Fills from the left when the figure arrives; width also eases if it changes later.
            className="h-1.5 origin-left animate-grow-x rounded-full bg-green-500 transition-[width] duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
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