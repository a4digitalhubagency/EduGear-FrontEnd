/** Mirrors the backend's src/students/dto/import.dto.ts (POST /students/import/csv). */

export const MAX_IMPORT_ROWS = 500;
/** ImportStudentsCsvDto caps the CSV text at 1,500,000 characters. */
export const MAX_IMPORT_CSV_CHARS = 1_500_000;

/**
 * ATOMIC: any failing row imports nothing (the safe default; fix the file and run again).
 * PARTIAL: good rows import, failing rows come back with reasons.
 */
export type ImportMode = "ATOMIC" | "PARTIAL";

export type ImportStudentsCsvInput = {
  csv: string; // the file's text, header row first
  mode?: ImportMode;
  dryRun?: boolean; // check every row and report, writing nothing
  defaultAdmissionDate?: string; // for rows with no admission date
  defaultClassArmId?: string; // for rows with no class
};

/** IMPORTED (written), VALID (passed, not written: a dry run or a rejected ATOMIC run), FAILED. */
export type ImportRowStatus = "IMPORTED" | "VALID" | "FAILED";

export type ImportRowResult = {
  row: number; // 1-based among the data rows
  line: number | null; // physical line in the CSV
  status: ImportRowStatus;
  studentName: string | null;
  admissionNumber: string | null; // assigned, or on a dry run the one it would get
  studentId: string | null; // the created student's id, once imported
  className: string | null;
  guardian: "CREATED" | "MATCHED" | "SHARED" | null; // SHARED: a sibling in the same file
  errors: { field: string; message: string }[];
  warnings: string[];
};

export type ImportOutcome = "IMPORTED" | "PARTIAL" | "REJECTED" | "VALIDATED";

export type ImportReport = {
  outcome: ImportOutcome;
  mode: ImportMode;
  dryRun: boolean;
  total: number;
  imported: number;
  valid: number; // passed but not written
  failed: number;
  guardiansCreated: number;
  guardiansMatched: number;
  fileWarnings: string[]; // about the file as a whole, e.g. ignored columns
  rows: ImportRowResult[];
};
