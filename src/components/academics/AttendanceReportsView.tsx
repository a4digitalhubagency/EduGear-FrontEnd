"use client";

import { useState } from "react";
import { Clock, Download, Percent, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { AttendanceAlertsCard } from "@/components/academics/AttendanceAlertsCard";
import { AttendanceRateBarChart } from "@/components/academics/AttendanceRateBarChart";
import { AttendanceStatCard } from "@/components/academics/AttendanceStatCard";
import {
  ATTENDANCE_ALERTS,
  ATTENDANCE_REPORT_STATS,
  ATTENDANCE_TREND_30_DAYS,
  ATTENDANCE_WEEKLY_TREND,
  REPORT_ARM_OPTIONS,
  REPORT_CLASS_LEVEL_OPTIONS,
  REPORT_DATE_RANGE_OPTIONS,
  REPORT_SESSION_OPTIONS,
  REPORT_TERM_OPTIONS,
} from "@/lib/mock-attendance-reports";

/**
 * "Attendance Reports" screen — an analytics/overview dashboard, distinct
 * from the Attendance Register (`/academics/attendance`, where a teacher
 * marks daily attendance for one class/day) and from the Student Profile's
 * own Attendance tab (still undesigned — see docs/ARCHITECTURE.md).
 *
 * Filters are presentational only for now: one fixed mock dataset backs
 * every Session/Term/Class/Arm/Date-Range combination, same "wire
 * everything at the end" simplification used across the rest of the app.
 * "Export" and "Full Chart" are inert affordances, same spirit as other
 * not-yet-wired buttons elsewhere (e.g. "More Actions" on Student Profile).
 */
export function AttendanceReportsView() {
  const [session, setSession] = useState(REPORT_SESSION_OPTIONS[0]);
  const [term, setTerm] = useState(REPORT_TERM_OPTIONS[1]);
  const [classLevel, setClassLevel] = useState(REPORT_CLASS_LEVEL_OPTIONS[0]);
  const [arm, setArm] = useState(REPORT_ARM_OPTIONS[0]);
  const [dateRange, setDateRange] = useState(REPORT_DATE_RANGE_OPTIONS[1]);

  const stats = ATTENDANCE_REPORT_STATS;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-gray">
            <span className="text-primary-navy">Academics</span> / Reports
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary-navy">Attendance Reports</h1>
          <p className="mt-1 text-sm text-slate-gray">
            Monitor attendance performance across students, classes, and academic periods.
          </p>
        </div>
        <Button type="button" variant="secondary" className="w-auto px-4 py-2.5">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select value={session} onChange={(e) => setSession(e.target.value)}>
          {REPORT_SESSION_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select value={term} onChange={(e) => setTerm(e.target.value)}>
          {REPORT_TERM_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select value={classLevel} onChange={(e) => setClassLevel(e.target.value)}>
          {REPORT_CLASS_LEVEL_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select value={arm} onChange={(e) => setArm(e.target.value)}>
          {REPORT_ARM_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          {REPORT_DATE_RANGE_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AttendanceStatCard
          icon={Percent}
          iconClass="text-bright-blue"
          bgClass="bg-cloud-sky"
          label="Overall Attendance Rate"
          value={`${stats.overallRate}%`}
          caption={stats.rateDeltaLabel}
          captionClass="text-green-600"
        />
        <AttendanceStatCard
          icon={UserCheck}
          iconClass="text-green-600"
          bgClass="bg-green-50"
          label="Total Present"
          value={stats.totalPresent.toLocaleString()}
          caption="Students today"
        />
        <AttendanceStatCard
          icon={UserX}
          iconClass="text-red-600"
          bgClass="bg-red-50"
          label="Total Absent"
          value={stats.totalAbsent.toLocaleString()}
          caption="Students today"
        />
        <AttendanceStatCard
          icon={Clock}
          iconClass="text-amber-600"
          bgClass="bg-amber-50"
          label="Total Late"
          value={stats.totalLate.toLocaleString()}
          caption="Students today"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-gray/10 bg-white p-5 lg:col-span-2">
          <h2 className="text-sm font-bold text-primary-navy">Attendance Trend (30 Days)</h2>
          <div className="mt-4">
            <AttendanceRateBarChart points={ATTENDANCE_TREND_30_DAYS} heightClassName="h-32" />
          </div>
        </div>

        <AttendanceAlertsCard alerts={ATTENDANCE_ALERTS} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-gray/10 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-primary-navy">Weekly Trend</h2>
          <button type="button" className="text-xs font-semibold text-bright-blue hover:underline">
            Full Chart
          </button>
        </div>
        <div className="mt-4">
          <AttendanceRateBarChart
            points={ATTENDANCE_WEEKLY_TREND}
            lowThreshold={80}
            showLabels
            heightClassName="h-24"
          />
        </div>
      </div>
    </div>
  );
}