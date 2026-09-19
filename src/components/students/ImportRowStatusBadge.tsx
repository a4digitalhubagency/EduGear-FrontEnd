import { AlertCircle, CheckCircle2, Copy, type LucideIcon } from "lucide-react";
import type { ImportRowStatus } from "@/types/bulk-import";

const STATUS_CONFIG: Record<ImportRowStatus, { label: string; className: string; icon: LucideIcon }> = {
  valid: { label: "Valid", className: "text-green-700", icon: CheckCircle2 },
  duplicate: { label: "Duplicate", className: "text-amber-600", icon: Copy },
  "missing-field": { label: "Missing Field", className: "text-red-600", icon: AlertCircle },
};

/**
 * Inline icon + text "Status" cell for the Bulk Import "Data Preview"
 * table — same plain text+icon treatment (not a pill) as
 * PromotionStatusBadge on the Student Promotion screen.
 */
export function ImportRowStatusBadge({ status }: { status: ImportRowStatus }) {
  const { label, className, icon: Icon } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}