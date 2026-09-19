import type { ImportValidationSummary } from "@/types/bulk-import";

/**
 * Fixed mock validation result returned for any file the admin uploads —
 * there's no real spreadsheet parser behind this wizard yet. The 4 totals
 * (1,220 total / 1,175 ready / 20 duplicates / 5 errors) are read directly
 * off the "Bulk Import - Validation" and "... Final Review" Stitch screens,
 * which agree on all 4 numbers. The 5 preview rows are invented — the
 * design's own row-level data wasn't legible at the screenshot's zoom
 * level — but the 3 status kinds they demonstrate (Valid/Duplicate/Missing
 * Field) are design-verified from the "Data Preview" column.
 */
export const MOCK_VALIDATION_RESULT: ImportValidationSummary = {
  totalRecords: 1220,
  readyToImport: 1175,
  duplicatesSkipped: 20,
  errorsFound: 5,
  previewRows: [
    { id: "1", name: "Adaeze Nwosu", studentId: "EDU-1189", className: "JSS 1A", status: "valid" },
    { id: "2", name: "Bashir Lawal", studentId: "EDU-1190", className: "JSS 1A", status: "valid" },
    {
      id: "3",
      name: "Aisha Bello",
      studentId: "EDU-0124",
      className: "SS 2A",
      status: "duplicate",
      note: "Matches existing student EDU-0124",
    },
    {
      id: "4",
      name: "Kelechi Obi",
      studentId: "—",
      className: "JSS 2B",
      status: "missing-field",
      note: "Missing guardian phone number",
    },
    { id: "5", name: "Grace Effiong", studentId: "EDU-1194", className: "SS 1C", status: "valid" },
  ],
};