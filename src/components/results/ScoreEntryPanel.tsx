"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Select } from "@/components/ui/Select";
import { LoadingText, RetryButton } from "@/components/ui/table";
import { TERM_LABELS } from "@/components/academics/setup/shared";
import { ArmOptions } from "@/components/students/ArmOptions";
import { ApiError, errorMessage } from "@/lib/api-client";
import { useClassArms, useTerms } from "@/lib/queries/academics";
import { useClassSubjects, useGradingScale, useSaveScores, useScoreSheet, useTeachingAssignments } from "@/lib/queries/results";
import { cn } from "@/lib/utils";
import type { GradeBand, ScoreSheet } from "@/types/results";

const cellKey = (studentId: string, componentId: string) => `${studentId}|${componentId}`;

function gradeFor(total: number, bands: GradeBand[]) {
  return bands.find((b) => total >= b.minScore && total <= b.maxScore) ?? null;
}

/** The sheet's saved scores as editable text, one entry per cell. */
function valuesFrom(sheet: ScoreSheet) {
  const values: Record<string, string> = {};
  for (const s of sheet.students) for (const c of s.scores) values[cellKey(s.studentId, c.componentId)] = c.score === null ? "" : String(c.score);
  return values;
}

/** Why the grid is read-only, from what the backend reports about it. */
function lockedReason(sheet: ScoreSheet) {
  if (sheet.locked) {
    return `${sheet.className} results for this term are ${sheet.status.toLowerCase()}, so scores are frozen. The principal can return them to draft if something must change.`;
  }
  return `Only the ${sheet.subjectName} teacher for ${sheet.className} (or the principal) can enter these scores.`;
}

/**
 * Score entry: one subject's grid for one arm and term (GET/PUT /results/scores).
 * Totals and grades update live from the school's grading scale; Save sends only the
 * cells that changed. The backend saves all or nothing and names every bad cell, which
 * is mapped back onto the grid and highlighted. Teachers get their own subjects as shortcuts.
 */
export function ScoreEntryPanel() {
  const terms = useTerms();
  const termList = terms.data?.data ?? [];
  const [pickedTerm, setPickedTerm] = useState<string | null>(null);
  const termId = pickedTerm ?? termList.find((t) => t.isCurrent)?.id ?? termList[termList.length - 1]?.id ?? "";

  const arms = useClassArms();
  const [classArmId, setClassArmId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const arm = (arms.data?.data ?? []).find((a) => a.id === classArmId);
  const offered = useClassSubjects(arm?.classId);
  const mine = useTeachingAssignments({ mine: true });
  const grading = useGradingScale();
  const bands = grading.data?.bands ?? [];

  const sheet = useScoreSheet({ classArmId, subjectId, termId });
  const save = useSaveScores();

  // Editable cells, reset whenever a fresh copy of the sheet arrives (render-time reset pattern).
  const [values, setValues] = useState<Record<string, string>>({});
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  if (sheet.data && sheet.dataUpdatedAt !== loadedAt) {
    setLoadedAt(sheet.dataUpdatedAt);
    setValues(valuesFrom(sheet.data));
    setCellErrors({});
  }

  const data = sheet.data;
  const original = useMemo(() => (data ? valuesFrom(data) : {}), [data]);
  const changed = Object.keys(values).filter((k) => values[k] !== original[k]);
  const dirty = changed.length > 0;

  function confirmDiscard() {
    return !dirty || window.confirm("You have unsaved scores. Discard them?");
  }

  function pick(arm: string, subject: string) {
    if (!confirmDiscard()) return;
    setClassArmId(arm);
    setSubjectId(subject);
    setSaveError(null);
    setSavedNote(null);
  }

  // Client-side check of each changed cell, before sending anything.
  const maxFor = new Map((data?.components ?? []).map((c) => [c.id, c.maxScore]));
  function cellProblem(key: string) {
    const raw = values[key]?.trim() ?? "";
    if (raw === "") return null;
    const n = Number(raw);
    const max = maxFor.get(key.split("|")[1]) ?? 100;
    if (!Number.isFinite(n) || n < 0) return "Enter a number";
    if (n > max) return `Out of ${max}`;
    return null;
  }

  async function handleSave() {
    if (!data) return;
    setSaveError(null);
    setSavedNote(null);
    const local: Record<string, string> = {};
    for (const key of changed) {
      const problem = cellProblem(key);
      if (problem) local[key] = problem;
    }
    if (Object.keys(local).length) {
      setCellErrors(local);
      setSaveError(`${Object.keys(local).length} score(s) need fixing before saving.`);
      return;
    }
    const entries = changed.map((key) => {
      const [studentId, componentId] = key.split("|");
      const raw = values[key].trim();
      return { studentId, componentId, score: raw === "" ? null : Number(raw) };
    });
    try {
      await save.mutateAsync({ classArmId, subjectId, termId, entries });
      setSavedNote(`Saved ${entries.length} score${entries.length === 1 ? "" : "s"}.`);
    } catch (err) {
      // Bad cells come back as entries[i] with reasons: put each reason on its cell.
      if (err instanceof ApiError && Array.isArray(err.details)) {
        const mapped: Record<string, string> = {};
        for (const d of err.details as { field?: string; constraints?: string[] }[]) {
          const index = Number(/entries\[(\d+)\]/.exec(d.field ?? "")?.[1]);
          const entry = entries[index];
          if (entry) mapped[cellKey(entry.studentId, entry.componentId)] = d.constraints?.join("; ") ?? "Invalid";
        }
        setCellErrors(mapped);
      }
      setSaveError(errorMessage(err));
    }
  }

  const editable = !!data?.canEdit;
  const subjectsForArm = offered.data ?? [];
  const myAssignments = (mine.data ?? []).filter((a) => a.classArmId && a.subjectId);

  return (
    <div>
      {myAssignments.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-gray">My subjects</p>
          <div className="flex flex-wrap gap-2">
            {myAssignments.map((a) => {
              const active = a.classArmId === classArmId && a.subjectId === subjectId;
              return (
                <button
                  key={`${a.classArmId}-${a.subjectId}`}
                  type="button"
                  onClick={() => pick(a.classArmId, a.subjectId)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    active ? "border-bright-blue bg-cloud-sky text-bright-blue" : "border-slate-gray/20 text-primary-navy hover:bg-cloud-sky/40",
                  )}
                >
                  {a.className} · {a.subjectName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select
          className="w-full"
          value={termId}
          onChange={(e) => {
            if (confirmDiscard()) setPickedTerm(e.target.value);
          }}
          aria-label="Term"
        >
          {termList.length === 0 && <option value="">No terms yet</option>}
          {termList.map((t) => (
            <option key={t.id} value={t.id}>
              {TERM_LABELS[t.name]}, {t.sessionName}
              {t.isCurrent ? " (current)" : ""}
            </option>
          ))}
        </Select>
        <Select className="w-full" value={classArmId} onChange={(e) => pick(e.target.value, "")} aria-label="Class and arm">
          <ArmOptions emptyLabel="Select class and arm" />
        </Select>
        <Select className="w-full" value={subjectId} onChange={(e) => pick(classArmId, e.target.value)} aria-label="Subject" disabled={!classArmId}>
          <option value="">{!classArmId ? "Select a class first" : subjectsForArm.length === 0 ? "No subjects offered" : "Select subject"}</option>
          {subjectsForArm.map((s) => (
            <option key={s.subjectId} value={s.subjectId}>
              {s.name}
              {s.isCompulsory ? "" : " (elective)"}
            </option>
          ))}
        </Select>
      </div>

      {classArmId && !offered.isPending && subjectsForArm.length === 0 && (
        <p className="mt-3 text-sm text-slate-gray">
          This class doesn&apos;t offer any subjects yet.{" "}
          <Link href="/academics/setup" className="font-semibold text-bright-blue hover:underline">
            Set them up in Academic Setup → Subjects
          </Link>
        </p>
      )}

      {!classArmId || !subjectId ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-gray/20 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-primary-navy">Pick a class and subject</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-gray">Choose the term, class and subject above to open its score sheet.</p>
        </div>
      ) : sheet.isPending ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          <LoadingText label="Loading score sheet..." />
        </div>
      ) : sheet.isError ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          {errorMessage(sheet.error)}
          {/* e.g. no assessment scheme yet */}
          {sheet.error instanceof ApiError && sheet.error.status === 409 ? (
            <Link href="/academics/setup" className="ml-1 font-semibold text-bright-blue hover:underline">
              Open Academic Setup
            </Link>
          ) : (
            <RetryButton onRetry={() => sheet.refetch()} />
          )}
        </div>
      ) : data ? (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-gray">
              <span className="font-semibold text-primary-navy">
                {data.subjectName} · {data.className}
              </span>{" "}
              · {data.entered} of {data.expected} scores entered
            </p>
            {editable && (
              <Button type="button" className="w-auto px-4 py-2.5" onClick={handleSave} isLoading={save.isPending} disabled={!dirty}>
                <Save className="h-4 w-4" />
                Save Scores{dirty ? ` (${changed.length})` : ""}
              </Button>
            )}
          </div>

          {!editable && (
            <div className="flex items-start gap-2.5 rounded-lg bg-slate-gray/5 p-3 text-sm text-slate-gray">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              {lockedReason(data)}
            </div>
          )}
          {saveError && <FormError message={saveError} />}
          {savedNote && !dirty && <p className="text-sm font-medium text-green-700">{savedNote}</p>}

          <div className="overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-gray/10 text-xs font-semibold uppercase tracking-wide text-slate-gray">
                  <th className="sticky left-0 z-10 bg-white shadow-[1px_0_0_rgba(100,116,139,0.12)] px-3 py-3 sm:px-4">Student</th>
                  {data.components.map((c) => (
                    <th key={c.id} className="w-24 px-2 py-3 text-center">
                      {c.name}
                      <span className="block text-[10px] font-medium normal-case text-slate-gray/70">out of {c.maxScore}</span>
                    </th>
                  ))}
                  <th className="w-20 px-2 py-3 text-center">Total</th>
                  <th className="w-20 px-2 py-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.students.length === 0 ? (
                  <tr>
                    <td colSpan={data.components.length + 3} className="px-4 py-10 text-center text-sm text-slate-gray">
                      No active students in {data.className}.
                    </td>
                  </tr>
                ) : (
                  data.students.map((s) => {
                    const total = data.components.reduce((sum, c) => sum + (Number(values[cellKey(s.studentId, c.id)]) || 0), 0);
                    const anyEntered = data.components.some((c) => (values[cellKey(s.studentId, c.id)] ?? "") !== "");
                    const band = anyEntered ? gradeFor(Math.round(total), bands) : null;
                    return (
                      <tr key={s.studentId} className="border-b border-slate-gray/10 last:border-0">
                        <td className="sticky left-0 z-10 bg-white shadow-[1px_0_0_rgba(100,116,139,0.12)] max-w-36 px-3 py-2 sm:max-w-none sm:px-4">
                          <p className="font-semibold text-primary-navy">{s.studentName}</p>
                          <p className="text-xs text-slate-gray">{s.admissionNumber}</p>
                        </td>
                        {data.components.map((c) => {
                          const key = cellKey(s.studentId, c.id);
                          const problem = cellErrors[key] ?? (values[key] !== original[key] ? cellProblem(key) : null);
                          const isChanged = values[key] !== original[key];
                          return (
                            <td key={c.id} className="px-2 py-2 text-center">
                              <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                max={c.maxScore}
                                step="any"
                                value={values[key] ?? ""}
                                disabled={!editable}
                                onChange={(e) => {
                                  setValues((v) => ({ ...v, [key]: e.target.value }));
                                  setCellErrors((errs) => {
                                    const next = { ...errs };
                                    delete next[key];
                                    return next;
                                  });
                                }}
                                title={problem ?? undefined}
                                aria-label={`${s.studentName}, ${c.name}`}
                                aria-invalid={!!problem}
                                className={cn(
                                  "w-16 rounded-md border px-2 py-1.5 text-center text-sm text-primary-navy focus:outline-none focus:ring-2 disabled:bg-slate-gray/5 disabled:text-slate-gray",
                                  problem
                                    ? "border-red-500 bg-red-50 focus:ring-red-500/20"
                                    : isChanged
                                      ? "border-bright-blue bg-cloud-sky/30 focus:ring-bright-blue/20"
                                      : "border-slate-gray/20 focus:border-bright-blue focus:ring-bright-blue/20",
                                )}
                              />
                              {problem && <p className="mt-0.5 text-[10px] font-medium text-red-600">{problem}</p>}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center font-semibold text-primary-navy">{anyEntered ? Math.round(total * 10) / 10 : "—"}</td>
                        <td className={cn("px-2 py-2 text-center font-semibold", band && !band.isPass ? "text-red-600" : "text-primary-navy")}>
                          {band?.grade ?? "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {editable && <p className="text-xs text-slate-gray">Changed cells are highlighted in blue until saved. Clear a cell to remove a score entered by mistake.</p>}
        </div>
      ) : null}
    </div>
  );
}
