/** Mirrors the backend's src/results/dto/result-sheet.dto.ts. */

export const RESULT_SHEET_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "PUBLISHED"] as const;
export type ResultSheetStatus = (typeof RESULT_SHEET_STATUSES)[number];

/** GET /results/sheets row. */
export type ResultSheetSummary = {
  id: string;
  classArmId: string;
  className: string;
  termId: string;
  termName: string;
  sessionName: string;
  status: ResultSheetStatus;
  studentCount: number;
  computedAt: string | null;
  stale: boolean; // scores changed since the last compute
  submittedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  returnedReason: string | null;
};

/** GET /results/report-cards/:studentId?termId (404 when the student has no results that term). */
export type ReportCard = {
  className: string;
  termName: string;
  sessionName: string;
  nextTermBegins: string | null;
  status: ResultSheetStatus;
  publishedAt: string | null;
  subjects: {
    subjectName: string;
    components: { name: string; maxScore: number; score: number | null }[];
    total: number;
    grade: string | null;
    remark: string | null;
    position: number | null;
    positionLabel: string | null; // "3rd"
    classHighest: number | null; // null when the school hides class figures
    classLowest: number | null;
    classAverage: number | null;
  }[];
  totalScore: number;
  averageScore: number;
  position: number | null;
  positionLabel: string | null; // "5th"
  outOf: number; // students ranked in the class
  subjectCount: number;
  passes: number;
  failures: number;
  formTeacherName: string | null;
  formTeacherComment: string | null;
  principalComment: string | null;
  attendance: { daysOpen: number; present: number; absent: number; late: number } | null;
};
