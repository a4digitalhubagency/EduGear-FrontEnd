import { cn } from "@/lib/utils";
import type { StudentStatus } from "@/types/student";

const STATUS_STYLES: Record<StudentStatus, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-red-100 text-red-700",
  graduated: "bg-cloud-sky text-bright-blue",
  pending: "bg-amber-100 text-amber-700",
  on_leave: "bg-purple-100 text-purple-700",
};

/** Dot color for the compact status indicator on the Student Profile header. */
export const STATUS_DOT_COLORS: Record<StudentStatus, string> = {
  active: "bg-green-500",
  inactive: "bg-red-500",
  graduated: "bg-bright-blue",
  pending: "bg-amber-500",
  on_leave: "bg-purple-500",
};

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
  pending: "Pending",
  on_leave: "On Leave",
};

/**
 * Status pill for a student record. "active"/"inactive"/"graduated" colors
 * are pulled directly from the "Students - List View (Desktop)" screen.
 * "pending" and "on_leave" only appeared on the "Students - List..." mobile
 * card at a zoom level where the badge colors weren't fully legible — these
 * two are a best-guess approximation, double check against Stitch if they
 * ever look wrong.
 */
export function StatusBadge({ status }: { status: StudentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}