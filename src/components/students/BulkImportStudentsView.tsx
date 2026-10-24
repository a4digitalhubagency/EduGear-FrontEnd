"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, FileSpreadsheet, TriangleAlert, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { ArmOptions } from "@/components/students/ArmOptions";
import { ImportRowStatusBadge } from "@/components/students/ImportRowStatusBadge";
import { downloadFile, errorMessage } from "@/lib/api-client";
import { useImportStudents } from "@/lib/queries/students";
import { useCan } from "@/lib/store/auth-store";
import { cn, getInitials } from "@/lib/utils";
import { MAX_IMPORT_CSV_CHARS, MAX_IMPORT_ROWS, type ImportMode, type ImportReport, type ImportRowResult } from "@/types/bulk-import";

type WizardStep = "upload" | "review" | "confirm" | "success";

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

const GUARDIAN_LABELS: Record<NonNullable<ImportRowResult["guardian"]>, string> = {
  CREATED: "New guardian",
  MATCHED: "Existing guardian",
  SHARED: "Shared with a sibling",
};

/** Rows that will become (or became) new guardian records: dry runs report 0 created, so count rows. */
function newGuardians(report: ImportReport) {
  return report.dryRun
    ? report.rows.filter((r) => r.status !== "FAILED" && r.guardian === "CREATED").length
    : report.guardiansCreated;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-4">
      <p className="text-xs font-semibold text-slate-gray">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", tone)}>{value.toLocaleString()}</p>
    </div>
  );
}

function ReportTable({ rows, title, subtitle }: { rows: ImportRowResult[]; title: string; subtitle: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
      <div className="border-b border-slate-gray/10 p-4">
        <h2 className="text-sm font-bold text-primary-navy">{title}</h2>
        <p className="text-xs text-slate-gray">{subtitle}</p>
      </div>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-gray/10 text-xs font-semibold uppercase tracking-wide text-slate-gray">
            <th className="px-4 py-3">Row</th>
            <th className="px-4 py-3">Student</th>
            <th className="px-4 py-3">Class</th>
            <th className="px-4 py-3">Guardian</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.row} className={cn("border-b border-slate-gray/10 last:border-0", row.status === "FAILED" && "bg-red-50/40")}>
              <td className="px-4 py-3 text-xs text-slate-gray">{row.line ? `Line ${row.line}` : `#${row.row}`}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                  >
                    {getInitials(row.studentName ?? "?")}
                  </div>
                  <div>
                    {row.studentId ? (
                      <Link href={`/students/${row.studentId}`} className="font-semibold text-primary-navy hover:underline">
                        {row.studentName}
                      </Link>
                    ) : (
                      <p className="font-semibold text-primary-navy">{row.studentName ?? "(no name)"}</p>
                    )}
                    <p className="text-xs text-slate-gray">{row.admissionNumber ?? "—"}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-gray">{row.className ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-gray">{row.guardian ? GUARDIAN_LABELS[row.guardian] : "—"}</td>
              <td className="px-4 py-3">
                <ImportRowStatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-xs">
                {row.errors.length === 0 && row.warnings.length === 0 ? (
                  <span className="text-slate-gray">—</span>
                ) : (
                  <ul className="space-y-0.5">
                    {row.errors.map((e) => (
                      <li key={`${e.field}-${e.message}`} className="text-red-600">
                        <span className="font-semibold">{e.field}:</span> {e.message}
                      </li>
                    ))}
                    {row.warnings.map((w) => (
                      <li key={w} className="text-amber-700">
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Bulk Import Students" wizard (Upload → Validate → Import), on POST /students/import/csv.
 * Validate is a real dry run: every row is checked and the report shows the admission
 * number each would get, its guardian (new, matched, or shared with a sibling) and any
 * errors. Import repeats the same call for real.
 *
 * CSV only (agreed): the backend takes CSV text, and Excel saves CSV via "Save As".
 * The design's "Duplicates" figure became "New guardians": the backend reports
 * duplicates as row errors, and guardian matching is what a registrar needs to check.
 */
export function BulkImportStudentsView() {
  const canImport = useCan("students.create");
  const importStudents = useImportStudents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<{ name: string; csv: string } | null>(null);
  const [mode, setMode] = useState<ImportMode>("ATOMIC");
  const [defaultClassArmId, setDefaultClassArmId] = useState("");
  const [defaultAdmissionDate, setDefaultAdmissionDate] = useState("");
  const [preview, setPreview] = useState<ImportReport | null>(null);
  const [result, setResult] = useState<ImportReport | null>(null);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  async function readFile(chosen: File | undefined | null) {
    if (!chosen) return;
    setError(null);
    if (!chosen.name.toLowerCase().endsWith(".csv")) {
      setError("Choose a .csv file. In Excel: File → Save As → \"CSV UTF-8 (Comma delimited)\".");
      return;
    }
    const csv = await chosen.text();
    if (csv.length > MAX_IMPORT_CSV_CHARS) {
      setError(`That file is too large. Split it into files of up to ${MAX_IMPORT_ROWS} students.`);
      return;
    }
    setFile({ name: chosen.name, csv });
    setPreview(null);
  }

  function options(dryRun: boolean) {
    return {
      csv: file!.csv,
      mode,
      dryRun,
      ...(defaultClassArmId ? { defaultClassArmId } : {}),
      ...(defaultAdmissionDate ? { defaultAdmissionDate } : {}),
    };
  }

  async function handleValidate() {
    if (!file) return;
    setError(null);
    try {
      setPreview(await importStudents.mutateAsync(options(true)));
      setOnlyProblems(false);
      setStep("review");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleImport() {
    setError(null);
    try {
      setResult(await importStudents.mutateAsync(options(false)));
      setStep("success");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleTemplate() {
    setTemplateError(null);
    try {
      await downloadFile("/students/import/template", "edugear-student-import-template.csv");
    } catch (err) {
      setTemplateError(errorMessage(err));
    }
  }

  function handleStartOver() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStep("upload");
  }

  const currentStepKey: "upload" | "review" | "confirm" = step === "success" ? "confirm" : step;
  // ATOMIC imports nothing if any row fails, so there's no point offering Import then.
  const blocked = !!preview && preview.failed > 0 && mode === "ATOMIC";
  const ready = preview ? preview.valid : 0;

  if (!canImport) {
    return (
      <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-12 text-center text-sm text-slate-gray">
        You don&apos;t have permission to import students.
      </div>
    );
  }

  return (
    <div>
      <div>
        <p className="text-sm text-slate-gray">
          <Link href="/students" className="hover:text-primary-navy hover:underline">
            Students
          </Link>{" "}
          / <span className="text-primary-navy">Bulk Import</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold text-primary-navy">Bulk Import Students</h1>
        <p className="mt-1 text-sm text-slate-gray">
          Upload and import up to {MAX_IMPORT_ROWS} student records at once from a spreadsheet.
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
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isActive ? "bg-primary-navy text-white" : isPast ? "bg-cloud-sky text-bright-blue" : "bg-slate-gray/10 text-slate-gray"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? "text-primary-navy" : "text-slate-gray"}`}>{s.label}</span>
                </div>
                {index < STEP_LABELS.length - 1 && <div className="h-px flex-1 bg-slate-gray/15" />}
              </div>
            );
          })}
        </div>
      )}

      {step === "upload" && (
        <div className="mt-6 animate-fade-in-up rounded-xl border border-slate-gray/10 bg-white p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void readFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "mx-auto flex max-w-md flex-col items-center rounded-xl border-2 border-dashed p-10 text-center transition-colors",
              dragging ? "border-bright-blue bg-cloud-sky/40" : "border-slate-gray/25 bg-cloud-sky/10",
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            {file ? (
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary-navy">
                {file.name}
                <button type="button" onClick={() => setFile(null)} aria-label="Remove file" className="text-slate-gray hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              </p>
            ) : (
              <p className="mt-4 text-sm font-semibold text-primary-navy">Drag and drop your file here</p>
            )}
            <p className="mt-1 text-xs text-slate-gray">
              CSV only. From Excel: File → Save As → &quot;CSV UTF-8&quot;.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                void readFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="secondary" className="mt-4 w-auto px-4 py-2.5" onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
          </div>

          <div className="mx-auto mt-4 flex max-w-md items-center justify-between gap-3 rounded-lg bg-cloud-sky/20 p-3 text-xs text-slate-gray">
            <span>Not sure of the format? Start from our template; it opens in Excel.</span>
            <Button type="button" variant="ghost" className="w-auto px-3 py-1.5" onClick={handleTemplate}>
              <Download className="h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>
          {templateError && (
            <div className="mx-auto mt-2 max-w-md">
              <FormError message={templateError} />
            </div>
          )}

          <div className="mx-auto mt-6 grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField label="Default Class/Arm" value={defaultClassArmId} onChange={(e) => setDefaultClassArmId(e.target.value)}>
              <ArmOptions emptyLabel="None (use the file)" />
            </SelectField>
            <Input
              label="Default Admission Date"
              type="date"
              value={defaultAdmissionDate}
              onChange={(e) => setDefaultAdmissionDate(e.target.value)}
            />
            <p className="-mt-2 text-xs text-slate-gray sm:col-span-2">Used only for rows that leave class or admission date blank.</p>
          </div>

          <fieldset className="mx-auto mt-4 max-w-md">
            <legend className="mb-1.5 text-sm font-semibold text-primary-navy">If some rows have problems</legend>
            <div className="space-y-2">
              {(
                [
                  ["ATOMIC", "Import nothing until the file is clean (recommended)", "Fix the flagged rows and upload again."],
                  ["PARTIAL", "Import the good rows, skip the rest", "You'll get a list of skipped rows to add separately."],
                ] as const
              ).map(([value, label, hint]) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-3",
                    mode === value ? "border-bright-blue bg-cloud-sky/30" : "border-slate-gray/15",
                  )}
                >
                  <input type="radio" name="import-mode" checked={mode === value} onChange={() => setMode(value)} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-semibold text-primary-navy">{label}</span>
                    <span className="text-xs text-slate-gray">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <div className="mx-auto mt-4 max-w-md">
              <FormError message={error} />
            </div>
          )}

          <div className="mx-auto mt-6 flex max-w-md justify-end">
            <Button type="button" onClick={handleValidate} disabled={!file} isLoading={importStudents.isPending} className="w-auto px-5 py-2.5">
              <Upload className="h-4 w-4" />
              Validate File
            </Button>
          </div>
        </div>
      )}

      {step === "review" && preview && (
        <div className="mt-6 animate-fade-in-up space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total Records" value={preview.total} tone="text-primary-navy" />
            <Stat label="Ready to Import" value={ready} tone="text-green-600" />
            <Stat label="Need Fixing" value={preview.failed} tone="text-red-600" />
            <Stat label="New Guardians" value={newGuardians(preview)} tone="text-bright-blue" />
          </div>

          {preview.fileWarnings.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-primary-navy">
              <p className="flex items-center gap-1.5 font-semibold">
                <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />
                About this file
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {preview.fileWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.failed > 0 && (
            <Checkbox label={`Show only the ${preview.failed} row${preview.failed === 1 ? "" : "s"} that need fixing`} checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} />
          )}

          <ReportTable
            rows={onlyProblems ? preview.rows.filter((r) => r.status === "FAILED") : preview.rows}
            title="Data Preview"
            subtitle="Every row checked. Nothing has been saved yet; admission numbers shown are the ones each student would get."
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" className="w-auto px-4 py-2.5" onClick={handleStartOver}>
              Back to Upload
            </Button>
            <Button type="button" className="w-auto px-4 py-2.5" onClick={() => setStep("confirm")} disabled={ready === 0}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && preview && (
        <div className="mt-6 animate-fade-in-up rounded-xl border border-slate-gray/10 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
            <Upload className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-primary-navy">{blocked ? "Not Ready to Import" : "Ready to Import"}</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-gray">
            {blocked
              ? `${preview.failed} row${preview.failed === 1 ? " has" : "s have"} problems, and this import is set to import nothing until the file is clean. Fix the file and upload it again, or go back and choose to skip problem rows.`
              : `${ready.toLocaleString()} student record${ready === 1 ? "" : "s"} will be admitted${preview.failed > 0 ? `; ${preview.failed} with problems will be skipped` : ""}.`}
          </p>

          <dl className="mx-auto mt-5 max-w-sm space-y-2 rounded-lg bg-cloud-sky/20 p-4 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-gray">Ready to import</dt>
              <dd className="font-semibold text-green-600">{ready.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-gray">Need fixing</dt>
              <dd className="font-semibold text-red-600">{preview.failed.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-gray">New guardians</dt>
              <dd className="font-semibold text-primary-navy">{newGuardians(preview).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-gray">Existing guardians matched</dt>
              <dd className="font-semibold text-primary-navy">{preview.guardiansMatched.toLocaleString()}</dd>
            </div>
          </dl>

          {error && (
            <div className="mx-auto mt-4 max-w-sm text-left">
              <FormError message={error} />
            </div>
          )}

          <div className="mx-auto mt-6 flex max-w-sm justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="w-auto flex-1"
              onClick={() => (blocked ? handleStartOver() : setStep("review"))}
              disabled={importStudents.isPending}
            >
              {blocked ? "Upload Fixed File" : "Back"}
            </Button>
            {!blocked && (
              <Button type="button" className="w-auto flex-1" onClick={handleImport} isLoading={importStudents.isPending}>
                Import Students
              </Button>
            )}
          </div>
        </div>
      )}

      {step === "success" && result && (
        <div className="mt-6 animate-fade-in-up space-y-4">
          <div className="rounded-xl border border-slate-gray/10 bg-white p-10 text-center">
            <div
              className={cn(
                "mx-auto flex h-12 w-12 items-center justify-center rounded-full",
                result.imported > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600",
              )}
            >
              {result.imported > 0 ? <CheckCircle2 className="h-6 w-6" /> : <TriangleAlert className="h-6 w-6" />}
            </div>
            <p className="mt-4 text-sm font-semibold text-primary-navy">
              {result.imported > 0
                ? `${result.imported.toLocaleString()} Student${result.imported === 1 ? "" : "s"} Successfully Imported`
                : "Nothing Was Imported"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-gray">
              {result.guardiansCreated} new guardian{result.guardiansCreated === 1 ? "" : "s"} created and {result.guardiansMatched} existing
              one{result.guardiansMatched === 1 ? "" : "s"} linked.
              {result.failed > 0 && ` ${result.failed} row${result.failed === 1 ? " was" : "s were"} skipped; see below.`}
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

          {result.failed > 0 && (
            <ReportTable
              rows={result.rows.filter((r) => r.status === "FAILED")}
              title="Skipped Rows"
              subtitle="These weren't imported. Fix them in a new file, or add them one by one with New Admission."
            />
          )}
        </div>
      )}
    </div>
  );
}
