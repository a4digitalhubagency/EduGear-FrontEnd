import type { AttendanceEntry, AttendanceRegister } from "@/types/attendance";

export const SESSION_OPTIONS_ATTENDANCE = ["2025/2026 Session", "2024/2025 Session"];
export const TERM_OPTIONS_ATTENDANCE = ["First Term", "Second Term", "Third Term"];
export const CLASS_OPTIONS_ATTENDANCE = ["SS 1", "SS 2", "SS 3", "JSS 1", "JSS 2", "JSS 3"];
export const ARM_OPTIONS_ATTENDANCE = ["A", "B", "C"];

/**
 * One shared roster for every class/arm/date combination — this screen
 * doesn't have a real per-class student list to draw from yet, so (like
 * the Students List and Student Profile mock data) it reuses the same
 * handful of people regardless of which class is picked. Names, IDs, and
 * "Previous Day" marks match the "Attendance" Stitch screen for SS 2 - Arm
 * A; every other class/arm/date combination gets the same 4-person roster
 * as a placeholder, a documented simplification rather than a design-
 * verified detail for every class.
 */
const BASE_ROSTER: Omit<AttendanceEntry, "status">[] = [
  {
    id: "att-1",
    name: "Aisha Bello",
    gender: "Female",
    displayId: "ADS-25-082",
    previousDayStatus: "present",
  },
  {
    id: "att-2",
    name: "Chidi Okoro",
    gender: "Male",
    displayId: "ADS-25-085",
    previousDayStatus: "present",
  },
  {
    id: "att-3",
    name: "Fatima Yusuf",
    gender: "Female",
    displayId: "ADS-25-012",
    previousDayStatus: "absent",
  },
  {
    id: "att-4",
    name: "Olawaseun Adebayo",
    gender: "Male",
    displayId: "ADS-25-018",
    previousDayStatus: "present",
  },
];

/** A fresh, unmarked register for the given day — used whenever no saved register exists yet for the selected class/arm/date. */
export function buildDraftRoster(): AttendanceEntry[] {
  return BASE_ROSTER.map((entry) => ({ ...entry, status: null }));
}

function registerKey(className: string, arm: string, date: string) {
  return `${className}-${arm}-${date}`;
}

/**
 * Only one register is seeded as already "completed" — SS 2 / Arm A on
 * 2026-09-16 — matching the "Completed" example on the "Attendance
 * Register - Operational States" screen (30 Present / 1 Absent / 1 Late in
 * the original design; scaled down to this screen's 4-person mock roster:
 * 2 Present / 1 Absent / 1 Late). Every other class/arm/date combination
 * starts with no register until a teacher picks one and saves it.
 */
export const MOCK_ATTENDANCE_REGISTERS: Record<string, AttendanceRegister> = {
  [registerKey("SS 2", "A", "2026-09-16")]: {
    className: "SS 2",
    arm: "A",
    date: "2026-09-16",
    status: "completed",
    submittedBy: "Mrs. Adebayo",
    submittedAt: "09:15 AM",
    entries: [
      { ...BASE_ROSTER[0], status: "present" },
      { ...BASE_ROSTER[1], status: "absent" },
      { ...BASE_ROSTER[2], status: "late" },
      { ...BASE_ROSTER[3], status: "present" },
    ],
  },
};

export function findAttendanceRegister(className: string, arm: string, date: string) {
  return MOCK_ATTENDANCE_REGISTERS[registerKey(className, arm, date)];
}