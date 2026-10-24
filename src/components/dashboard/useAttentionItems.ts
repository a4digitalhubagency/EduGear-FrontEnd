"use client";

import { AlertTriangle, CalendarX, ClipboardCheck, Clock, MailWarning, UserX, type LucideIcon } from "lucide-react";
import { useCurrentSession, useCurrentTerm } from "@/lib/queries/academics";
import { useFinanceSummary } from "@/lib/queries/finance";
import { useListTotal } from "@/lib/queries/totals";
import { useCan } from "@/lib/store/auth-store";
import { formatNaira } from "@/lib/utils";

export interface AttentionItem {
  key: string;
  icon: LucideIcon;
  iconClassName: string;
  bgClassName: string;
  title: string;
  detail: string;
  href?: string;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/**
 * Things that need a person to act, built from live counts (the backend has no task
 * list, and staff have no notifications endpoint; those exist only for parents).
 * Used by the dashboard's Needs Attention card and the header bell. The queries share
 * keys with the dashboard's, so both places read one cached set of requests.
 * Each item only appears when its count is above zero and the user can see that data.
 */
export function useAttentionItems() {
  const canReadAcademics = useCan("academics.read");
  const canUpdateAcademics = useCan("academics.update");
  const canReadFinance = useCan("finance.read");
  const canPublishResults = useCan("results.publish");
  const canReadUsers = useCan("users.read");
  const canReadStudents = useCan("students.read");

  const session = useCurrentSession(canReadAcademics);
  const term = useCurrentTerm(canReadAcademics);
  const sessionId = session.data?.id;
  // A disabled query stays "pending" forever in TanStack v5, so only wait when it can load.
  const financeReady = canReadFinance && (!canReadAcademics || !session.isPending);

  const finance = useFinanceSummary({ sessionId }, financeReady);
  const debtors = useListTotal("/finance/reports/debtors", { sessionId }, financeReady);
  const overdue = useListTotal("/finance/reports/debtors", { sessionId, overdueOnly: true }, financeReady);
  const submittedSheets = useListTotal("/results/sheets", { status: "SUBMITTED" }, canPublishResults);
  const invitations = useListTotal("/users", { status: "INVITED" }, canReadUsers);
  const unassigned = useListTotal("/students", { status: "ACTIVE", unassigned: true }, canReadStudents);

  const items: AttentionItem[] = [];
  if (canUpdateAcademics && term.isSuccess && term.data === null) {
    items.push({
      key: "term",
      icon: CalendarX,
      iconClassName: "text-red-600",
      bgClassName: "bg-red-50",
      title: "No current term is set",
      detail: "Attendance, fees and results all need one. Set it in Academic Setup.",
      href: "/academics/setup",
    });
  }
  if (debtors.data) {
    items.push({
      key: "debtors",
      icon: AlertTriangle,
      iconClassName: "text-red-600",
      bgClassName: "bg-red-50",
      title: `${plural(debtors.data, "student")} ${debtors.data === 1 ? "has" : "have"} outstanding fees`,
      detail: overdue.data ? `${plural(overdue.data, "student")} past the due date.` : "None past the due date yet.",
      href: "/finance?tab=debtors",
    });
  }
  if (finance.data?.pendingVerification) {
    items.push({
      key: "verification",
      icon: Clock,
      iconClassName: "text-amber-600",
      bgClassName: "bg-amber-50",
      title: `${formatNaira(finance.data.pendingVerification)} awaiting verification`,
      detail: "Recorded payments that don't count as collected until verified.",
      href: "/finance?tab=payments",
    });
  }
  if (submittedSheets.data) {
    items.push({
      key: "results",
      icon: ClipboardCheck,
      iconClassName: "text-amber-600",
      bgClassName: "bg-amber-50",
      title: `${plural(submittedSheets.data, "result sheet")} awaiting approval`,
      detail: "Submitted by form teachers and ready for review.",
    });
  }
  if (invitations.data) {
    items.push({
      key: "invitations",
      icon: MailWarning,
      iconClassName: "text-slate-600",
      bgClassName: "bg-slate-100",
      title: `${plural(invitations.data, "staff invitation")} pending`,
      detail: "Invited staff who haven't accepted and set a password yet.",
      href: "/personnel",
    });
  }
  if (unassigned.data) {
    items.push({
      key: "unassigned",
      icon: UserX,
      iconClassName: "text-slate-600",
      bgClassName: "bg-slate-100",
      title: `${plural(unassigned.data, "student")} without a class`,
      detail: "Active students not yet placed in an arm.",
      href: "/students",
    });
  }

  // Disabled queries also report isPending in TanStack v5, so only count ones actually fetching.
  const loading = [finance, debtors, overdue, submittedSheets, invitations, unassigned].some(
    (q) => q.isPending && q.fetchStatus === "fetching",
  );

  return { items, loading };
}
