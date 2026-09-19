import type { AttendanceAlert, AttendanceTrendPoint } from "@/types/attendance";

export const REPORT_SESSION_OPTIONS = ["2023/2024", "2024/2025"];
export const REPORT_TERM_OPTIONS = ["First Term", "Second Term", "Third Term"];
export const REPORT_CLASS_LEVEL_OPTIONS = [
  "All Classes",
  "SS 1",
  "SS 2",
  "SS 3",
  "JSS 1",
  "JSS 2",
  "JSS 3",
];
export const REPORT_ARM_OPTIONS = ["All Arms", "A", "B", "C"];
export const REPORT_DATE_RANGE_OPTIONS = ["Last 7 Days", "Last 30 Days", "This Term"];

/** Matches the 4 stat cards on the "Attendance Reports - Overview (Desktop)" screen exactly. */
export const ATTENDANCE_REPORT_STATS = {
  overallRate: 92,
  rateDeltaLabel: "+1.2%",
  totalPresent: 1840,
  totalAbsent: 124,
  totalLate: 36,
};

/**
 * Illustrative only — the Stitch screen itself shows a
 * "[Chart Visualization Rendering]" placeholder in place of a real chart
 * here, so there was nothing to read actual values off of. 30 plausible
 * points, oscillating in the high-80s/low-90s, same spirit as the
 * "illustrative bar heights" already used on the Dashboard's Attendance
 * Overview card.
 */
export const ATTENDANCE_TREND_30_DAYS: AttendanceTrendPoint[] = [
  88, 90, 91, 89, 92, 93, 90, 87, 85, 88, 91, 94, 92, 90, 89, 86, 88, 91, 93, 95, 92, 90, 88, 91,
  93, 94, 92, 90, 91, 92,
].map((rate, index) => ({ label: `Day ${index + 1}`, rate }));

/**
 * Matches the "Weekly Trend" mini chart on the Stitch screen — Wednesday
 * is the one bar shown in the design's "low" color, the rest are the
 * default series color.
 */
export const ATTENDANCE_WEEKLY_TREND: AttendanceTrendPoint[] = [
  { label: "Mon", rate: 90 },
  { label: "Tue", rate: 88 },
  { label: "Wed", rate: 78 },
  { label: "Thu", rate: 91 },
  { label: "Fri", rate: 89 },
];

/** Matches the two "Requires Attention" items on the Stitch screen exactly. */
export const ATTENDANCE_ALERTS: AttendanceAlert[] = [
  {
    id: "critical-low-attendance",
    severity: "critical",
    title: "Critical Low Attendance",
    description: "12 students have attendance below 75% across the session.",
    actionLabel: "View Students",
    actionHref: "/students",
  },
  {
    id: "class-performance-alert",
    severity: "warning",
    title: "Class Performance Alert",
    description: "SS2A has the lowest attendance rate (81%) this month.",
    actionLabel: "View Class",
    actionHref: "/students",
  },
];