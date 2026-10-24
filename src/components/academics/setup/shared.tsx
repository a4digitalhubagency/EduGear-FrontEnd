"use client";

import type { TermName } from "@/types/academics";

// The generic table helpers moved to @/components/ui/table; re-exported so existing imports keep working.
export {
  IconAction,
  LoadingText,
  RetryButton,
  TABLE_CARD,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TableStateRow,
} from "@/components/ui/table";

export const TERM_LABELS: Record<TermName, string> = {
  FIRST: "First Term",
  SECOND: "Second Term",
  THIRD: "Third Term",
};

/** Same pill shape as StatusBadge; green like its "Active". */
export function CurrentBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
      Current
    </span>
  );
}
