"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Download, Percent, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { LoadingText, TABLE_HEAD_ROW, TABLE_ROW } from "@/components/ui/table";
import { AttendanceAlertsCard } from "@/components/academics/AttendanceAlertsCard";
import { AttendanceRateBarChart } from "@/components/academics/AttendanceRateBarChart";
import { AttendanceStatCard } from "@/components/academics/AttendanceStatCard";
import { TERM_LABELS } from "@/components/academics/setup/shared";
import { ArmOptions } from "@/components/students/ArmOptions";
import { useClassArms, useTerms } from "@/lib/queries/academics";
import { useArmAttendanceSummaries } from "@/lib/queries/attendance";
import { cn } from "@/lib/utils";
import type { AttendanceAlert, AttendanceTrendPoint, StudentAttendanceSummary } from "@/types/attendance";

/** Students at or under this rate are flagged; under CRITICAL_RATE they're flagged red. */
const LOW_RATE = 75;
const CRITICAL_RATE = 50;

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

type Row = StudentAttendanceSummary & { armName: string };

/** The table as CSV, generated in the browser: one line per student. */
function downloadCsv(rows: Row[], termLabel: string) {
  const header = ["Admission No", "Student", "Class", "Days", "Present", "Late", "Absent", "Excused", "Rate %"];
  const escape = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v));
  const lines = rows.map((r) =>
    [r.admissionNumber, r.studentName, r.armName, r.daysOpen, r.present - r.late, r.late, r.absent - r.excused, r.excused, Math.round(r.rate)]
      .map(escape)
      .join(","),
  );
  // The BOM makes Excel read it as UTF-8 (names with accents survive).
  const blob = new Blob(["﻿" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-${termLabel.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * "Attendance Reports", on GET /attendance/summary (one arm, one term at a time).
 * "All arms" combines every arm's summary, as the dashboard does. Differences from the
 * design, because the backend summarises whole terms rather than days or weeks:
 * no date-range filter, cards count student-days for the term (not "today"), the
 * 30-day trend became attendance by arm (or by student for one arm), and the weekly
 * trend became a per-student table. Export downloads that table as CSV.
 */
export function AttendanceReportsView() {
  const terms = useTerms();
  const termList = terms.data?.data ?? [];
  const [pickedTerm, setPickedTerm] = useState<string | null>(null);
  const termId = pickedTerm ?? termList.find((t) => t.isCurrent)?.id ?? termList[termList.length - 1]?.id;
  const term = termList.find((t) => t.id === termId);
  const termLabel = term ? `${TERM_LABELS[term.name]}, ${term.sessionName}` : "";

  const arms = useClassArms();
  const armList = arms.data?.data ?? [];
  const [armFilter, setArmFilter] = useState(""); // "" = all arms
  const shownArms = armFilter ? armList.filter((a) => a.id === armFilter) : armList;
  const summaries = useArmAttendanceSummaries(termId, shownArms.map((a) => a.id));

  const loading = terms.isPending || arms.isPending || (!!termId && summaries.some((q) => q.isPending));
  const failed = summaries.some((q) => q.isError);

  // Students who were on at least one register; cheap enough (a few hundred rows) to recompute each render.
  const rows: Row[] = shownArms.flatMap((arm, i) =>
    (summaries[i]?.data ?? []).filter((r) => r.daysOpen > 0).map((r) => ({ ...r, armName: arm.fullName })),
  );

  const totals = rows.reduce(
    (t, r) => ({ days: t.days + r.daysOpen, present: t.present + r.present, late: t.late + r.late, absent: t.absent + r.absent }),
    { days: 0, present: 0, late: 0, absent: 0 },
  );

  const points: AttendanceTrendPoint[] = armFilter
    ? [...rows].sort((a, b) => a.studentName.localeCompare(b.studentName)).map((r) => ({ label: r.studentName, rate: Math.round(r.rate) }))
    : shownArms.flatMap((arm, i) => {
        const armRows = (summaries[i]?.data ?? []).filter((r) => r.daysOpen > 0);
        const days = armRows.reduce((s, r) => s + r.daysOpen, 0);
        return days > 0 ? [{ label: arm.fullName, rate: pct(armRows.reduce((s, r) => s + r.present, 0), days) }] : [];
      });

  const low = [...rows].filter((r) => r.rate <= LOW_RATE).sort((a, b) => a.rate - b.rate);
  const alerts: AttendanceAlert[] = low.slice(0, 4).map((r) => ({
    id: r.studentId,
    severity: r.rate < CRITICAL_RATE ? "critical" : "warning",
    title: `${r.studentName}: ${Math.round(r.rate)}% attendance`,
    description: `${r.armName} · absent ${r.absent} of ${r.daysOpen} days this term.`,
    actionLabel: "View Student",
    actionHref: `/students/${r.studentId}`,
  }));
  const table = [...rows].sort((a, b) => a.rate - b.rate || a.studentName.localeCompare(b.studentName));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-gray">
            <span className="text-primary-navy">Academics</span> / Reports
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary-navy">Attendance Reports</h1>
          <p className="mt-1 text-sm text-slate-gray">Monitor attendance performance across students, classes, and terms.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-auto px-4 py-2.5"
          onClick={() => downloadCsv(table, termLabel)}
          disabled={table.length === 0}
          title={table.length === 0 ? "Nothing to export yet" : "Download this table as a spreadsheet"}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
        <Select className="w-full" value={termId ?? ""} onChange={(e) => setPickedTerm(e.target.value)} aria-label="Term" disabled={termList.length === 0}>
          {termList.length === 0 && <option value="">No terms yet</option>}
          {termList.map((t) => (
            <option key={t.id} value={t.id}>
              {TERM_LABELS[t.name]}, {t.sessionName}
              {t.isCurrent ? " (current)" : ""}
            </option>
          ))}
        </Select>
        <Select className="w-full" value={armFilter} onChange={(e) => setArmFilter(e.target.value)} aria-label="Class and arm">
          <ArmOptions emptyLabel="All classes and arms" />
        </Select>
      </div>

      {loading ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          <LoadingText label="Loading attendance..." />
        </div>
      ) : !termId ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          No terms have been set up yet.
        </div>
      ) : failed ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          Couldn&apos;t load attendance. Refresh to try again.
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          No registers have been taken {armFilter ? "for this arm " : ""}in {termLabel} yet.{" "}
          <Link href="/academics/attendance" className="font-semibold text-bright-blue hover:underline">
            Take a register
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AttendanceStatCard icon={Percent} iconClass="text-bright-blue" bgClass="bg-cloud-sky" label="Overall Attendance Rate" value={`${pct(totals.present, totals.days)}%`} caption={termLabel} />
            <AttendanceStatCard icon={UserCheck} iconClass="text-green-600" bgClass="bg-green-50" label="Present (on time)" value={(totals.present - totals.late).toLocaleString()} caption="Student-days this term" />
            <AttendanceStatCard icon={UserX} iconClass="text-red-600" bgClass="bg-red-50" label="Absent" value={totals.absent.toLocaleString()} caption="Student-days, incl. excused" />
            <AttendanceStatCard icon={Clock} iconClass="text-amber-600" bgClass="bg-amber-50" label="Late" value={totals.late.toLocaleString()} caption="Student-days this term" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-gray/10 bg-white p-5 lg:col-span-2">
              <h2 className="text-sm font-bold text-primary-navy">{armFilter ? "Attendance by Student" : "Attendance by Class Arm"}</h2>
              <p className="text-xs text-slate-gray">{termLabel} so far. Hover a bar for its exact rate.</p>
              <div className="mt-4">
                <AttendanceRateBarChart points={points} lowThreshold={LOW_RATE} showLabels={!armFilter && points.length <= 12} heightClassName="h-36" />
              </div>
            </div>
            {alerts.length > 0 ? (
              <AttendanceAlertsCard alerts={alerts} />
            ) : (
              <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
                <h2 className="text-sm font-bold text-primary-navy">Requires Attention</h2>
                <p className="mt-3 rounded-lg bg-green-50 p-3 text-xs font-semibold text-primary-navy">
                  No student is at or below {LOW_RATE}% attendance.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
            <div className="px-5 pt-4">
              <h2 className="text-sm font-bold text-primary-navy">Students</h2>
              <p className="text-xs text-slate-gray">
                Lowest attendance first{low.length > 4 ? `; ${low.length} students are at or below ${LOW_RATE}%` : ""}.
              </p>
            </div>
            <table className="mt-3 w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className={TABLE_HEAD_ROW}>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Days</th>
                  <th className="px-5 py-3">Present</th>
                  <th className="px-5 py-3">Late</th>
                  <th className="px-5 py-3">Absent</th>
                  <th className="px-5 py-3">Rate</th>
                </tr>
              </thead>
              <tbody>
                {table.map((r) => (
                  <tr key={r.studentId} className={TABLE_ROW}>
                    <td className="px-5 py-3">
                      <Link href={`/students/${r.studentId}`} className="font-semibold text-primary-navy hover:underline">
                        {r.studentName}
                      </Link>
                      <p className="text-xs text-slate-gray">{r.admissionNumber}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-gray">{r.armName}</td>
                    <td className="px-5 py-3 text-slate-gray">{r.daysOpen}</td>
                    <td className="px-5 py-3 text-slate-gray">{r.present - r.late}</td>
                    <td className="px-5 py-3 text-slate-gray">{r.late}</td>
                    <td className="px-5 py-3 text-slate-gray">
                      {r.absent}
                      {r.excused > 0 && <span className="text-xs"> ({r.excused} excused)</span>}
                    </td>
                    <td className={cn("px-5 py-3 font-semibold", r.rate <= LOW_RATE ? "text-red-600" : "text-primary-navy")}>
                      {Math.round(r.rate)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
