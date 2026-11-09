import Image from "next/image";
import { cn } from "../lib/utils";

interface EduGearLogoProps {
  /** "mark" = full colour (use on light backgrounds). "outline" = all white (use on the dark navy panel). */
  variant?: "mark" | "outline";
  /** Show the "EduGear" wordmark next to the icon. */
  withWordmark?: boolean;
  className?: string;
}

/**
 * EduGear brand logo: the cap-and-E icon, cut from public/brand/logo.png, with the wordmark as
 * live text so it stays sharp at sidebar size. Already small files, so no image optimiser needed.
 */
export function EduGearLogo({
  variant = "mark",
  withWordmark = false,
  className,
}: EduGearLogoProps) {
  const isOutline = variant === "outline";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src={isOutline ? "/brand/mark-white.png" : "/brand/mark.png"}
        alt={withWordmark ? "" : "EduGear"}
        width={150}
        height={176}
        unoptimized
        loading="eager"
        className="h-11 w-auto shrink-0"
      />

      {withWordmark && (
        <div className="leading-tight">
          <p className={cn("text-lg font-bold", isOutline ? "text-white" : "text-primary-navy")}>
            Edu<span className={isOutline ? undefined : "text-bright-blue"}>Gear</span>
          </p>
        </div>
      )}
    </div>
  );
}
