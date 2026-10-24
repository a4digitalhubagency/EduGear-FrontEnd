import { STUDENT_STATUS_LABELS } from "@/lib/student-labels";
import { cn } from "@/lib/utils";
import type { StudentStatus } from "@/types/students";

/**
 * Backend status colours. Active/Inactive/Graduated keep the design's colours;
 * Transferred and Withdrawn have no design, so they get purple and neutral grey.
 */
const STUDENT_STATUS_STYLES: Record<StudentStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-red-100 text-red-700",
  GRADUATED: "bg-cloud-sky text-bright-blue",
  TRANSFERRED: "bg-purple-100 text-purple-700",
  WITHDRAWN: "bg-slate-gray/10 text-slate-gray",
};

/** Dot colour for the compact status indicator on the Student Profile header. */
export const STUDENT_STATUS_DOT_COLORS: Record<StudentStatus, string> = {
  ACTIVE: "bg-green-500",
  INACTIVE: "bg-red-500",
  GRADUATED: "bg-bright-blue",
  TRANSFERRED: "bg-purple-500",
  WITHDRAWN: "bg-slate-gray",
};

/** Status pill for the backend's five student statuses. */
export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        STUDENT_STATUS_STYLES[status],
      )}
    >
      {STUDENT_STATUS_LABELS[status]}
    </span>
  );
}
