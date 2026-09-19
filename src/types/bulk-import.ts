export type ImportRowStatus = "valid" | "duplicate" | "missing-field";

export interface ImportPreviewRow {
  id: string;
  name: string;
  studentId: string;
  className: string;
  status: ImportRowStatus;
  note?: string;
}

export interface ImportValidationSummary {
  totalRecords: number;
  readyToImport: number;
  duplicatesSkipped: number;
  errorsFound: number;
  previewRows: ImportPreviewRow[];
}