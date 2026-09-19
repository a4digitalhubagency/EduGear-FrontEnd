import { Ban, CheckCircle2, Clock, type LucideIcon } from "lucide-react";
import type { PromotionStatus } from "@/types/promotion";

const STATUS_CONFIG: Record<PromotionStatus, { label: string; className: string; icon: LucideIcon }> = {
  eligible: { label: "Eligible", className: "text-green-700", icon: CheckCircle2 },
  "pending-review": { label: "Pending Review", className: "text-amber-600", icon: Clock },
  ineligible: { label: "Ineligible", className: "text-slate-gray", icon: Ban },
};

/**
 * Inline icon + text "Promotion Status" cell, matching the "check_circle
 * Eligible" / "schedule Pending Review" / "cancel Ineligible" styling from
 * the Setup & List screen's table (plain text+icon, not a pill — unlike
 * the Students List's StatusBadge).
 */
export function PromotionStatusBadge({ status }: { status: PromotionStatus }) {
  const { label, className, icon: Icon } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}