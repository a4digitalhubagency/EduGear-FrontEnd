"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { LoadingText, RetryButton } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { usePortalMe } from "@/lib/queries/portal";
import { cn, formatNaira } from "@/lib/utils";

const TERM_WORD: Record<string, string> = { FIRST: "First", SECOND: "Second", THIRD: "Third" };

/** "My children": one card per child with class, fee balance and latest published result (GET /portal/me). */
export function PortalHome() {
  const me = usePortalMe();

  if (me.isPending) {
    return (
      <p className="rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
        <LoadingText label="Loading..." />
      </p>
    );
  }
  if (me.isError) {
    return (
      <p className="rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
        {errorMessage(me.error)}
        <RetryButton onRetry={() => me.refetch()} />
      </p>
    );
  }

  const { fullName, children, unreadNotifications } = me.data;
  const firstName = fullName.split(" ")[0];

  return (
    <div>
      <h1 className="text-xl font-bold text-primary-navy">Welcome, {firstName}</h1>
      <p className="mt-1 text-sm text-slate-gray">
        {children.length === 1 ? "Your child at a glance." : "Your children at a glance."}
        {unreadNotifications > 0 && (
          <>
            {" "}
            <Link href="/portal/notifications" className="font-semibold text-bright-blue hover:underline">
              {unreadNotifications} new notification{unreadNotifications === 1 ? "" : "s"}
            </Link>
          </>
        )}
      </p>

      {children.length === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-8 text-center text-sm text-slate-gray">
          No children are linked to your account yet. Please contact the school.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {children.map((child, i) => (
            <Link
              key={child.studentId}
              href={`/portal/children/${child.studentId}`}
              className="block animate-fade-in-up rounded-xl border border-slate-gray/10 bg-white p-4 transition-shadow hover:shadow-md"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <StudentAvatar id={child.studentId} name={child.fullName} photoUrl={child.photoUrl} className="h-12 w-12 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-primary-navy">{child.fullName}</p>
                  <p className="text-xs text-slate-gray">
                    {child.className ?? "No class yet"} · {child.admissionNumber}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-gray/50" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Fees owed</p>
                  <p className={cn("font-bold", child.feeBalance > 0 ? "text-red-600" : "text-green-700")}>
                    {child.feeBalance > 0 ? formatNaira(child.feeBalance) : "All paid"}
                  </p>
                  {child.pendingPayments > 0 && (
                    <p className="text-[11px] text-amber-700">{formatNaira(child.pendingPayments)} awaiting confirmation</p>
                  )}
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Latest result</p>
                  {child.latestResult ? (
                    <>
                      <p className="font-bold text-primary-navy">
                        {child.latestResult.averageScore.toFixed(1)}%
                        {child.latestResult.positionLabel && ` · ${child.latestResult.positionLabel} of ${child.latestResult.outOf}`}
                      </p>
                      <p className="text-[11px] text-slate-gray">
                        {TERM_WORD[child.latestResult.termName] ?? child.latestResult.termName} Term, {child.latestResult.sessionName}
                      </p>
                    </>
                  ) : (
                    <p className="font-semibold text-slate-gray">None published yet</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
