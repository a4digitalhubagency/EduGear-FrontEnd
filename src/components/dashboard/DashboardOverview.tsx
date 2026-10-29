"use client";

import Link from "next/link";
import { AlertTriangle, Briefcase, Coins, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AttendanceOverviewCard } from "@/components/dashboard/AttendanceOverviewCard";
import { NeedsAttentionCard } from "@/components/dashboard/NeedsAttentionCard";
import { FinanceHealthCard } from "@/components/dashboard/FinanceHealthCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { TERM_LABELS } from "@/components/academics/setup/shared";
import { useCurrentSession, useCurrentTerm } from "@/lib/queries/academics";
import { useFinanceSummary } from "@/lib/queries/finance";
import { useListTotal } from "@/lib/queries/totals";
import { useAuthStore, useCan } from "@/lib/store/auth-store";
import { formatNaira } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** "…" while loading, "—" if the request failed, otherwise the formatted value. */
function display<T>(query: { data?: T; isError: boolean }, format: (value: T) => string) {
  if (query.isError) return "—";
  return query.data === undefined ? "…" : format(query.data);
}

function PeriodChip({ label, value, missing }: { label: string; value: string | undefined; missing: boolean }) {
  return (
    <div className="rounded-lg border border-slate-gray/15 bg-white px-3 py-2 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-gray">{label}</p>
      {missing ? (
        <Link href="/academics/setup" className="text-sm font-semibold text-bright-blue hover:underline">
          Not set
        </Link>
      ) : (
        <p className="text-sm font-semibold text-primary-navy">{value ?? "…"}</p>
      )}
    </div>
  );
}

/**
 * "School Administrator Dashboard - Overview" on the real API. The backend has no
 * single dashboard endpoint, so each card reads its own source, and each card only
 * appears (and only fetches) for users holding its permission:
 * - students.read: Total Students; users.read: Total Staff
 * - finance.read: Fee Collection, Outstanding Fees, Finance Health (current session)
 * - attendance.read: Attendance Overview (current term, per arm)
 * - audit.read: Recent Activity
 * The design's trend badges ("+12", "+8%", "vs Last Term") are gone: the backend
 * keeps no history to compare against, and a made-up trend is worse than none.
 */
export function DashboardOverview() {
  const firstName = useAuthStore((s) => s.user?.firstName);
  const schoolName = useAuthStore((s) => s.activeSchool?.schoolName);
  const canReadAcademics = useCan("academics.read");
  const canReadStudents = useCan("students.read");
  const canReadUsers = useCan("users.read");
  const canReadFinance = useCan("finance.read");

  const session = useCurrentSession(canReadAcademics);
  const term = useCurrentTerm(canReadAcademics);
  const sessionId = session.data?.id;

  const students = useListTotal("/students", { status: "ACTIVE" }, canReadStudents);
  const staff = useListTotal("/users", { status: "ACTIVE" }, canReadUsers);
  // Scoped to the current session once known; all-time if the school hasn't set one or
  // the user can't read academics. (A disabled query stays "pending" forever in TanStack v5,
  // so waiting on session.isPending alone would never let finance load for those users.)
  const sessionResolved = !canReadAcademics || !session.isPending;
  const financeEnabled = canReadFinance && sessionResolved;
  const finance = useFinanceSummary({ sessionId }, financeEnabled);
  const debtors = useListTotal("/finance/reports/debtors", { sessionId }, financeEnabled);
  const hasBilling = !!finance.data && finance.data.totalPayable > 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-gray">
            Here&apos;s what&apos;s happening at {schoolName ?? "your school"} today.
          </p>
        </div>

        {canReadAcademics && (
          <div className="flex gap-2">
            <PeriodChip
              label="Academic Session"
              value={session.data ? `${session.data.name} Session` : undefined}
              missing={session.isSuccess && session.data === null}
            />
            <PeriodChip
              label="Current Term"
              value={term.data ? TERM_LABELS[term.data.name] : undefined}
              missing={term.isSuccess && term.data === null}
            />
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canReadStudents && (
          <StatCard
            icon={Users}
            iconClassName="bg-blue-100 text-blue-700"
            index={0}
          label="Total Students"
            value={display(students, (n) => n.toLocaleString())}
            caption="Active Registrations"
          />
        )}
        {canReadUsers && (
          <StatCard
            icon={Briefcase}
            iconClassName="bg-slate-100 text-slate-600"
            index={1}
          label="Total Staff"
            value={display(staff, (n) => n.toLocaleString())}
            caption="Active Staff Accounts"
          />
        )}
        {canReadFinance && (
          <>
            <StatCard
              icon={Coins}
              iconClassName="bg-green-100 text-green-700"
              badgeText={hasBilling ? `${Math.round(finance.data!.collectionRate)}% collected` : undefined}
              badgeTone="positive"
              index={2}
          label="Fee Collection"
              value={display(finance, (f) => formatNaira(f.totalCollected, true))}
              // With nothing billed the backend reports a 100% rate; a full bar over ₦0 would mislead.
              progressPercent={hasBilling ? finance.data!.collectionRate : undefined}
              caption={finance.data && !hasBilling ? "No Invoices Yet" : undefined}
            />
            <StatCard
              icon={AlertTriangle}
              iconClassName="bg-red-100 text-red-700"
              // Only when someone owes: a red "0 students" reads like an alarm.
              badgeText={debtors.data ? `${debtors.data.toLocaleString()} student${debtors.data === 1 ? "" : "s"}` : undefined}
              badgeTone="negative"
              index={3}
          label="Outstanding Fees"
              value={display(finance, (f) => formatNaira(f.totalOutstanding, true))}
              // "All Settled" only means something once fees have been billed.
              caption={finance.data && finance.data.totalOutstanding > 0 ? "Action Required" : hasBilling ? "All Settled" : "No Invoices Yet"}
              captionTone={finance.data && finance.data.totalOutstanding > 0 ? "negative" : "neutral"}
            />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceOverviewCard termId={term.data?.id} termLabel={term.data ? TERM_LABELS[term.data.name] : undefined} />
        </div>
        <NeedsAttentionCard />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {canReadFinance && <FinanceHealthCard summary={finance.data} isError={finance.isError} />}
        <QuickActionsCard />
        <RecentActivityCard />
      </div>
    </div>
  );
}
