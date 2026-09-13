import { GraduationCap } from "lucide-react";
import { cn } from "../lib/utils";

interface EduGearLogoProps {
  /** "mark" = solid navy badge (use on light backgrounds). "outline" = white outline badge (use on the dark navy panel). */
  variant?: "mark" | "outline";
  /** Show the "EduGear" wordmark next to the badge. */
  withWordmark?: boolean;
  className?: string;
}

/**
 * EduGear brand mark: a graduation-cap glyph in a rounded square badge.
 * Matches the icon used throughout the Stitch design system (sidebar, auth screens, dashboard header).
 */
export function EduGearLogo({
  variant = "mark",
  withWordmark = false,
  className,
}: EduGearLogoProps) {
  const isOutline = variant === "outline";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          isOutline
            ? "border-2 border-white/70 bg-transparent"
            : "bg-primary-navy",
        )}
      >
        <GraduationCap
          className={cn("h-6 w-6", isOutline ? "text-white" : "text-white")}
          strokeWidth={2}
        />
      </div>

      {withWordmark && (
        <div className="leading-tight">
          <p
            className={cn(
              "text-lg font-bold",
              isOutline ? "text-white" : "text-primary-navy",
            )}
          >
            EduGear
          </p>
        </div>
      )}
    </div>
  );
}