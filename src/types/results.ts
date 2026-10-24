/** Mirrors the backend's src/results/dto/*.dto.ts. */

export const RESULT_SHEET_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "PUBLISHED"] as const;
export type ResultSheetStatus = (typeof RESULT_SHEET_STATUSES)[number];

// --- Subjects and who teaches them ------------------------------------------

export type Subject = {
  id: string;
  name: string; // "Mathematics"
  code: string; // "MTH", for report cards
  isActive: boolean; // retired subjects keep their history
  classCount: number; // classes offering it
  createdAt: string;
};

/** GET /results/classes/:classId/subjects row: an offered subject with the teacher per arm. */
export type ClassSubject = {
  subjectId: string;
  name: string;
  code: string;
  isCompulsory: boolean; // electives count only for students with scores in them
  teachers: { classArmId: string; armName: string; teacherMembershipId: string | null; teacherName: string | null }[];
};

/** GET /results/teaching-assignments row: who teaches which subject to which arm. */
export type TeachingAssignment = {
  classArmId: string;
  className: string; // "JSS1 A"
  subjectId: string;
  subjectName: string;
  teacherMembershipId: string;
  teacherName: string | null;
};

// --- Assessment scheme and grading scale ------------------------------------

export type AssessmentComponent = { id: string; name: string; maxScore: number; sortOrder: number };

/** How a subject is marked, e.g. 3 CAs of 10 and a 70-mark exam. Components total 100. */
export type AssessmentScheme = {
  configured: boolean;
  locked: boolean; // scores exist, so only names can change
  components: AssessmentComponent[];
};

export type GradeBand = { grade: string; minScore: number; maxScore: number; remark: string; isPass: boolean };

/** How marks become grades. Bands cover 0-100 in whole marks, highest first. */
export type GradingScale = { configured: boolean; bands: GradeBand[] };

/** POST /results/setup-defaults: what exists after, and what was created just now. */
export type ResultsSetup = { scheme: AssessmentScheme; grading: GradingScale; created: string[] };

// --- Score entry ------------------------------------------------------------

export type ScoreSheetQuery = { classArmId: string; subjectId: string; termId: string };

/** GET /results/scores: one subject's grid for one arm and term. */
export type ScoreSheet = {
  classArmId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  isCompulsory: boolean;
  termId: string;
  termName: string;
  sessionName: string;
  status: ResultSheetStatus;
  locked: boolean; // submitted or later: scores are frozen
  canEdit: boolean; // the backend's verdict for the signed-in user
  components: { id: string; name: string; maxScore: number }[];
  students: {
    studentId: string;
    admissionNumber: string;
    studentName: string;
    scores: { componentId: string; score: number | null }[];
    total: number;
    grade: string | null;
    complete: boolean;
  }[];
  entered: number;
  expected: number; // cells a compulsory subject needs; electives count only takers
};

/** PUT /results/scores. All or nothing; null clears a cell entered by mistake. Max 1000 cells. */
export type SaveScoresInput = ScoreSheetQuery & {
  entries: { studentId: string; componentId: string; score: number | null }[];
};

// --- Result sheets ----------------------------------------------------------

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

/** GET /results/sheets/:id: a class's results in position order, with class figures. */
export type ResultSheet = ResultSheetSummary & {
  students: {
    studentId: string;
    admissionNumber: string;
    studentName: string;
    totalScore: number;
    averageScore: number;
    position: number | null;
    positionLabel: string | null; // "2nd"
    subjectCount: number;
    passes: number;
    failures: number;
    formTeacherComment: string | null;
    principalComment: string | null;
  }[];
  subjects: { subjectId: string; subjectName: string; highest: number; lowest: number; average: number; studentCount: number }[];
  /** Live for a draft, always empty once submitted. */
  missing: { studentId: string; studentName: string; subjectId: string; subjectName: string; components: string[] }[];
  ready: boolean; // a draft with every score in, ready to submit
};

/** GET /results/report-cards/:studentId?termId (404 when the student has no results that term). */
export type ReportCard = {
  school: {
    name: string;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    email: string;
    logoUrl: string | null;
    motto: string | null;
  };
  student: { id: string; admissionNumber: string; fullName: string; gender: "MALE" | "FEMALE"; dateOfBirth: string | null; photoUrl: string | null };
  className: string;
  termName: string;
  sessionName: string;
  nextTermBegins: string | null;
  status: ResultSheetStatus; // anything but PUBLISHED is provisional
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
  gradeScale: GradeBand[];
};
