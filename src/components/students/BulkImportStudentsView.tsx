"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImportRowStatusBadge } from "@/components/students/ImportRowStatusBadge";
import { getInitials } from "@/lib/utils";
import { MOCK_VALIDATION_RESULT } from "@/lib/mock-bulk-import";
import type { ImportValidationSummary } from "@/types/bulk-import";

type WizardStep = "upload" | "validating" | "review" | "confirm" | "importing" | "success";

const STEP_LABELS: { key: "upload" | "review" | "confirm"; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "review", label: "Validate" },
  { key: "confirm", label: "Import" },
];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
];

/**
 * "Bulk Import Students" wizard — the "Bulk Import - File Upload", "...
 * Validation", and "... Final Review" ("Ready to Import") Stitch screens.
 * The narrower "Bulk Import" mobile-card thumbnail is a smaller breakpoint
 * of the same flow, not a distinct screen — same "desktop reflows, no
 * separate mobile build" treatment as the Students List. Reached from the
 * "Import Students" button on the Students List, which was inert until now.
 *
 * The Stitch subtitle ("upload and map your spreadsheet data") implies a
 * column-mapping step, but no Mapping screen exists in the project yet —
 * skipped here on the assumption that importing via the provided
 * "Download Template" file means the columns are already in the expected
 * order, so there's nothing meaningful to map. If a Mapping screen turns
 * up later, this wizard gets a step inserted between Upload and Validate.
 *
 * Validation is entirely mocked: whatever file is chosen, after a short
 * simulated delay it resolves to the same fixed `MOCK_VALIDATION_RESULT`
 * (matching the Stitch screens' own numbers — 1,220 total / 1,175 ready /
 * 20 duplicates / 5 errors, which the Validation and Final Review screens
 * agree on). The 5 preview rows are invented — the design's own row-level
 * data wasn't legible at the screenshot's zoom level — but the 3 status
 * kinds they demonstrate (Valid/Duplicate/Missing Field) are
 * design-verified from the "Data Preview" column. "Download Template" is
 * an inert affordance — there's no real template file to serve yet.
 *
 * Per the "no shared client-side state" decision, a completed import
 * doesn't add anything to `MOCK_STUDENTS` — "View Students" on the
 * success screen just returns to the existing (unchanged) Students list,
 * same simplification as Add Student's own success screen.
 */
export function BulkImportStudentsView() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportValidationSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChosen(file: File | null) {
    if (file) setFileName(file.name);
  }

  async function handleValidate() {
    setStep("validating");
    // TODO: wire up to the real EduGear "validate bulk import file" endpoint once the backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setResult(MOCK_VALIDATION_RESULT);
    setStep("review");
  }

  async function handleImport() {
    setStep("importing");
    // TODO: wire up to the real EduGear "commit bulk import" endpoint once the backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStep("success");
  }

  function handleStartOver() {
    setFileName(null);
    setResult(null);
    setStep("upload");
  }

  const currentStepKey: "upload" | "review" | "confirm" =
    step === "validating" ? "upload" : step === "importing" ? "confirm" : (step as "upload" | "review" | "confirm");

  return (
    <div>
      <div>
        <p className="text-sm text-slate-gray">
          <span className="text-primary-navy">Students</span> / Bulk Import
        </p>
        <h1 className="mt-1 text-2xl font-bold text-primary-navy">Bulk Import Students</h1>
        <p className="mt-1 text-sm text-slate-gray">
          Upload and import multiple student records at once from a spreadsheet.
        </p>
      </div>

      {step !== "success" && (
        <div className="mt-6 flex items-center gap-3">
          {STEP_LABELS.map((s, index) => {
            const isActive = s.key === currentStepKey;
            const isPast = STEP_LABELS.findIndex((x) => x.key === currentStepKey) > index;
            return (
              <div key={s.key} className="flex flex-1 items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-primary-navy text-white"
                        : isPast
                          ? "bg-cloud-sky text-bright-blue"
                          : "bg-slate-gray/10 text-slate-gray"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? "text-primary-navy" : "text-slate-gray"}`}>
                    {s.label}
                  </span>
                </div>
                {index < STEP_LABELS.length - 1 && <div className="h-px flex-1 bg-slate-gray/15" />}
              </div>
            );
          })}
        </div>
      )}

      {(step === "upload" || step === "validating") && (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-8">
          <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border-2 border-dashed border-slate-gray/25 bg-cloud-sky/10 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-primary-navy">
              {fileName ? fileName : "Drag and drop your file here"}
            </p>
            <p className="mt-1 text-xs text-slate-gray">Accepts .csv or .xlsx, up to 5MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-auto px-4 py-2.5"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>

          <div className="mx-auto mt-4 flex max-w-md items-center justify-between gap-3 rounded-lg bg-cloud-sky/20 p-3 text-xs text-slate-gray">
            <span>Not sure of the format? Start from our template.</span>
            <Button type="button" variant="ghost" className="w-auto px-3 py-1.5">
              <Download className="h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>

          <div className="mx-auto mt-6 flex max-w-md justify-end">
            <Button
              type="button"
              onClick={handleValidate}
              disabled={!fileName}
              isLoading={step === "validating"}
              className="w-auto px-5 py-2.5"
            >
              <Upload className="h-4 w-4" />
              Validate File
            </Button>
          </div>
        </div>
      )}

      {step === "review" && result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-gray/10 bg-white p-4">
              <p className="text-xs font-semibold text-slate-gray">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-primary-navy">{result.totalRecords.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-gray/10 bg-white p-4">
              <p className="text-xs font-semibold text-slate-gray">Ready to Import</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{result.readyToImport.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-gray/10 bg-white p-4">
              <p className="text-xs font-semibold text-slate-gray">Duplicates Skipped</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{result.duplicatesSkipped.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-gray/10 bg-white p-4">
              <p className="text-xs font-semibold text-slate-gray">Errors Found</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{result.errorsFound.toLocaleString()}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
            <div className="border-b border-slate-gray/10 p-4">
              <h2 className="text-sm font-bold text-primary-navy">Data Preview</h2>
              <p className="text-xs text-slate-gray">
                Showing a sample of {result.previewRows.length} records from your file.
              </p>
            </div>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-gray/10 text-xs font-semibold uppercase tracking-wide text-slate-gray">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {result.previewRows.map((row, index) => (
                  <tr key={row.id} className="border-b border-slate-gray/10 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                        >
                          {getInitials(row.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-primary-navy">{row.name}</p>
                          <p className="text-xs text-slate-gray">{row.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-gray">{row.className}</td>
                    <td className="px-4 py-3">
                      <ImportRowStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-gray">{row.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" className="w-auto px-4 py-2.5" onClick={handleStartOver}>
              Back to Upload
            </Button>
            <Button type="button" className="w-auto px-4 py-2.5" onClick={() => setStep("confirm")}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {(step === "confirm" || step === "importing") && result && (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
            <Upload className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-primary-navy">Ready to Import</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-gray">
            {result.readyToImport.toLocaleString()} student records have been validated and are ready to be
            imported into the current academic session.
          </p>

          <dl className="mx-auto mt-5 max-w-sm space-y-2 rounded-lg bg-cloud-sky/20 p-4 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-gray">Ready to import</dt>
              <dd className="font-semibold text-green-600">{result.readyToImport.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-gray">Duplicates skipped</dt>
              <dd className="font-semibold text-amber-600">{result.duplicatesSkipped.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-gray">Errors found</dt>
              <dd className="font-semibold text-red-600">{result.errorsFound.toLocaleString()}</dd>
            </div>
          </dl>

          <div className="mx-auto mt-6 flex max-w-sm justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="w-auto flex-1"
              onClick={() => setStep("review")}
              disabled={step === "importing"}
            >
              Back
            </Button>
            <Button type="button" className="w-auto flex-1" onClick={handleImport} isLoading={step === "importing"}>
              Import Students
            </Button>
          </div>
        </div>
      )}

      {step === "success" && result && (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-primary-navy">
            {result.readyToImport.toLocaleString()} Students Successfully Imported
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-gray">
            {result.duplicatesSkipped} duplicate{result.duplicatesSkipped === 1 ? "" : "s"} were skipped and{" "}
            {result.errorsFound} record{result.errorsFound === 1 ? "" : "s"} with errors were not imported.
          </p>
          <div className="mx-auto mt-6 flex max-w-sm justify-center gap-3">
            <Button type="button" variant="secondary" className="w-auto flex-1" onClick={handleStartOver}>
              Import Another File
            </Button>
            <Link href="/students" className="flex-1">
              <Button type="button" className="w-full px-4 py-2.5">
                View Students
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}