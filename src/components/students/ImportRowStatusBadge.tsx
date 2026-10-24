import { AlertCircle, CheckCircle2, CircleCheckBig, type LucideIcon } from "lucide-react";
import type { ImportRowStatus } from "@/types/bulk-import";

const STATUS_CONFIG: Record<ImportRowStatus, { label: string; className: string; icon: LucideIcon }> = {
  VALID: { label: "Ready", className: "text-green-700", icon: CheckCircle2 },
  IMPORTED: { label: "Imported", className: "text-bright-blue", icon: CircleCheckBig },
  FAILED: { label: "Needs Fixing", className: "text-red-600", icon: AlertCircle },
};

/**
 * Inline icon + text "Status" cell for the Bulk Import preview table, same plain
 * text+icon treatment (not a pill) as the design shows. Statuses are the backend's:
 * Ready (passed validation), Imported (written), Needs Fixing (failed with reasons).
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
