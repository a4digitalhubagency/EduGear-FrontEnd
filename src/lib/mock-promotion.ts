import type { PromotionCandidate } from "@/types/promotion";

export const PROMOTION_SESSION_OPTIONS = ["2025/2026", "2026/2027"];
export const PROMOTION_CLASS_OPTIONS = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];
export const PROMOTION_ARM_OPTIONS = ["A", "B", "C"];

/**
 * Straight-line "next class" used to auto-fill the Destination Class the
 * moment a Current Class is picked (matching the "JSS 2 -> JSS 3" default
 * shown in the "Student Promotion - Setup & List" screen). The admin can
 * still override it — this is just a starting guess, not a validated
 * promotion path.
 */
export const NEXT_CLASS: Record<string, string> = {
  "JSS 1": "JSS 2",
  "JSS 2": "JSS 3",
  "JSS 3": "SS 1",
  "SS 1": "SS 2",
  "SS 2": "SS 3",
  "SS 3": "Graduated",
};

/**
 * The 4 example candidates shown in the "JSS 2A Roster" table on the
 * "Student Promotion - Setup & List (Desktop)" screen. The design's own
 * "32 Students" badge and "Promote Selected (12)" figures aren't
 * reproducible from 4 rows — the roster badge and button counts in the
 * view are wired to this array's real length instead, same "don't fabricate
 * a number the mock data can't back up" approach used for the Attendance
 * Register's roster.
 *
 * Only "JSS 2" / "A" is seeded; every other Current Class/Arm combination
 * loads an empty roster (a "No students found" table row) until real data
 * is wired up — same simplification as the Attendance Register mock store.
 */
const JSS2A_ROSTER: PromotionCandidate[] = [
  {
    id: "1",
    name: "Adebayo, Oluwafemi",
    displayId: "EDU-0124",
    gender: "Male",
    averageScore: 82,
    performanceLabel: "Credit",
    status: "eligible",
  },
  {
    id: "2",
    name: "Chukwu, Emeka",
    displayId: "EDU-0145",
    gender: "Male",
    averageScore: 91,
    performanceLabel: "Distinction",
    status: "eligible",
  },
  {
    id: "3",
    name: "Ibrahim, Aisha",
    displayId: "EDU-0210",
    gender: "Female",
    averageScore: 48,
    performanceLabel: "Pass (Borderline)",
    status: "pending-review",
  },
  {
    id: "4",
    name: "Okafor, Michael",
    displayId: "EDU-0288",
    gender: "Male",
    averageScore: 32,
    performanceLabel: "Fail",
    status: "ineligible",
  },
];

export function findPromotionRoster(className: string, arm: string): PromotionCandidate[] {
  if (className === "JSS 2" && arm === "A") return JSS2A_ROSTER;
  return [];
}