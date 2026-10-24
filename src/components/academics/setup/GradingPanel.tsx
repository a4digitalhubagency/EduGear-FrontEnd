"use client";

import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { LoadingText, RetryButton, TABLE_HEAD_ROW } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import {
  useApplyResultsDefaults,
  useAssessmentScheme,
  useGradingScale,
  useSetAssessmentScheme,
  useSetGradingScale,
} from "@/lib/queries/results";
import { useCan } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils";
import type { AssessmentScheme, GradeBand, GradingScale } from "@/types/results";

const CELL = "w-full rounded-md border border-slate-gray/20 px-2 py-1.5 text-sm text-primary-navy focus:border-bright-blue focus:outline-none disabled:bg-slate-gray/5 disabled:text-slate-gray";

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <h2 className="text-sm font-bold text-primary-navy">{title}</h2>
      <p className="mt-1 text-xs text-slate-gray">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Edits the components; their marks must add up to 100. Once scores exist, only names change. */
function SchemeEditor({ scheme, canEdit }: { scheme: AssessmentScheme; canEdit: boolean }) {
  const save = useSetAssessmentScheme();
  const [rows, setRows] = useState(scheme.components.map((c) => ({ name: c.name, maxScore: String(c.maxScore) })));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const total = rows.reduce((sum, r) => sum + (Number(r.maxScore) || 0), 0);
  const locked = scheme.locked;

  function update(index: number, patch: Partial<(typeof rows)[number]>) {
    setRows((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  async function submit() {
    setError(null);
    if (rows.some((r) => !r.name.trim())) return setError("Every component needs a name.");
    if (total !== 100) return setError(`The marks must add up to 100; they add up to ${total}.`);
    try {
      await save.mutateAsync(rows.map((r) => ({ name: r.name.trim(), maxScore: Number(r.maxScore) })));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      {locked && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-primary-navy">
          Scores have been entered, so the marks are fixed. You can still rename components.
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={TABLE_HEAD_ROW}>
            <th className="py-2 pr-2">Component</th>
            <th className="w-28 py-2 pr-2">Out of</th>
            <th className="w-10 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-1.5 pr-2">
                <input className={CELL} value={r.name} maxLength={40} disabled={!canEdit} onChange={(e) => update(i, { name: e.target.value })} aria-label={`Component ${i + 1} name`} />
              </td>
              <td className="py-1.5 pr-2">
                <input
                  className={CELL}
                  type="number"
                  min={1}
                  max={100}
                  value={r.maxScore}
                  disabled={!canEdit || locked}
                  onChange={(e) => update(i, { maxScore: e.target.value })}
                  aria-label={`Component ${i + 1} marks`}
                />
              </td>
              <td className="py-1.5 text-right">
                {canEdit && !locked && rows.length > 1 && (
                  <button type="button" onClick={() => setRows((c) => c.filter((_, j) => j !== i))} aria-label="Remove component" className="rounded-md p-1.5 text-slate-gray hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-sm font-semibold", total === 100 ? "text-green-700" : "text-red-600")}>Total: {total} / 100</p>
        {canEdit && (
          <div className="flex gap-2">
            {!locked && rows.length < 10 && (
              <Button type="button" variant="ghost" className="w-auto px-3 py-2" onClick={() => setRows((c) => [...c, { name: "", maxScore: "" }])}>
                <Plus className="h-4 w-4" />
                Add Component
              </Button>
            )}
            <Button type="button" className="w-auto px-4 py-2" onClick={submit} isLoading={save.isPending}>
              Save Scheme
            </Button>
          </div>
        )}
      </div>
      {saved && <p className="mt-2 text-sm font-medium text-green-700">Assessment scheme saved.</p>}
      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}
    </>
  );
}

/** Edits the grade bands. The backend checks they cover 0-100 with no gaps or overlaps. */
function GradingEditor({ grading, canEdit }: { grading: GradingScale; canEdit: boolean }) {
  const save = useSetGradingScale();
  type Row = { grade: string; minScore: string; maxScore: string; remark: string; isPass: boolean };
  const [rows, setRows] = useState<Row[]>(
    grading.bands.map((b) => ({ ...b, minScore: String(b.minScore), maxScore: String(b.maxScore) })),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  async function submit() {
    setError(null);
    const bands: GradeBand[] = rows.map((r) => ({
      grade: r.grade.trim(),
      minScore: Number(r.minScore),
      maxScore: Number(r.maxScore),
      remark: r.remark.trim(),
      isPass: r.isPass,
    }));
    if (bands.some((b) => !b.grade || !b.remark)) return setError("Every band needs a grade and a remark.");
    if (bands.some((b) => b.minScore > b.maxScore)) return setError("A band's lowest mark can't be above its highest.");
    try {
      await save.mutateAsync(bands);
      setSaved(true);
    } catch (err) {
      // e.g. "Nothing covers 41–44, between C6 and D7"
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="w-20 py-2 pr-2">Grade</th>
              <th className="w-20 py-2 pr-2">From</th>
              <th className="w-20 py-2 pr-2">To</th>
              <th className="py-2 pr-2">Remark</th>
              <th className="w-16 py-2 pr-2">Pass</th>
              <th className="w-10 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="py-1.5 pr-2">
                  <input className={CELL} value={r.grade} maxLength={4} disabled={!canEdit} onChange={(e) => update(i, { grade: e.target.value })} aria-label={`Band ${i + 1} grade`} />
                </td>
                <td className="py-1.5 pr-2">
                  <input className={CELL} type="number" min={0} max={100} value={r.minScore} disabled={!canEdit} onChange={(e) => update(i, { minScore: e.target.value })} aria-label={`Band ${i + 1} lowest mark`} />
                </td>
                <td className="py-1.5 pr-2">
                  <input className={CELL} type="number" min={0} max={100} value={r.maxScore} disabled={!canEdit} onChange={(e) => update(i, { maxScore: e.target.value })} aria-label={`Band ${i + 1} highest mark`} />
                </td>
                <td className="py-1.5 pr-2">
                  <input className={CELL} value={r.remark} maxLength={40} disabled={!canEdit} onChange={(e) => update(i, { remark: e.target.value })} aria-label={`Band ${i + 1} remark`} />
                </td>
                <td className="py-1.5 pr-2 text-center">
                  <input type="checkbox" checked={r.isPass} disabled={!canEdit} onChange={(e) => update(i, { isPass: e.target.checked })} aria-label={`Band ${i + 1} is a pass`} className="h-4 w-4" />
                </td>
                <td className="py-1.5 text-right">
                  {canEdit && rows.length > 1 && (
                    <button type="button" onClick={() => setRows((c) => c.filter((_, j) => j !== i))} aria-label="Remove band" className="rounded-md p-1.5 text-slate-gray hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {rows.length < 20 && (
            <Button
              type="button"
              variant="ghost"
              className="w-auto px-3 py-2"
              onClick={() => setRows((c) => [...c, { grade: "", minScore: "", maxScore: "", remark: "", isPass: true }])}
            >
              <Plus className="h-4 w-4" />
              Add Band
            </Button>
          )}
          <Button type="button" className="w-auto px-4 py-2" onClick={submit} isLoading={save.isPending}>
            Save Grading Scale
          </Button>
        </div>
      )}
      {saved && <p className="mt-2 text-sm font-medium text-green-700">Grading scale saved. Published results keep their old grades.</p>}
      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}
    </>
  );
}

/**
 * "Assessment & Grading" tab of Academic Setup: how each subject is marked (components
 * totalling 100) and how marks become grades. Changing either needs results.publish
 * (principal level). Until both exist, "Apply common defaults" sets them in one step.
 */
export function GradingPanel() {
  const canRead = useCan("results.read");
  const canEdit = useCan("results.publish");
  const scheme = useAssessmentScheme(canRead);
  const grading = useGradingScale(canRead);
  const defaults = useApplyResultsDefaults();
  const [error, setError] = useState<string | null>(null);

  if (!canRead) {
    return <p className="rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">You don&apos;t have access to results settings.</p>;
  }
  if (scheme.isPending || grading.isPending) {
    return (
      <p className="rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
        <LoadingText label="Loading..." />
      </p>
    );
  }
  if (scheme.isError || grading.isError) {
    return (
      <p className="rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
        {errorMessage(scheme.error ?? grading.error)}
        <RetryButton
          onRetry={() => {
            void scheme.refetch();
            void grading.refetch();
          }}
        />
      </p>
    );
  }

  const missing = !scheme.data.configured || !grading.data.configured;

  return (
    <div className="space-y-4">
      {missing && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bright-blue/20 bg-cloud-sky/30 p-4">
          <div>
            <p className="text-sm font-semibold text-primary-navy">Start with the common setup</p>
            <p className="text-xs text-slate-gray">
              Three continuous assessments of 10 marks and a 70-mark exam, graded on the WAEC A1–F9 scale. You can adjust it afterwards.
            </p>
          </div>
          {canEdit && (
            <Button
              type="button"
              className="w-auto px-4 py-2.5"
              isLoading={defaults.isPending}
              onClick={() => {
                setError(null);
                defaults.mutateAsync().catch((err) => setError(errorMessage(err)));
              }}
            >
              <Sparkles className="h-4 w-4" />
              Apply Common Defaults
            </Button>
          )}
        </div>
      )}
      {error && <FormError message={error} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Assessment Scheme" description="How every subject is marked, in report-card order. The marks must add up to 100.">
          {scheme.data.configured || canEdit ? (
            // key: start fresh when the saved scheme changes (e.g. after applying defaults)
            <SchemeEditor key={JSON.stringify(scheme.data.components)} scheme={scheme.data} canEdit={canEdit} />
          ) : (
            <p className="text-sm text-slate-gray">Not set up yet.</p>
          )}
        </Card>
        <Card title="Grading Scale" description="How a subject's total becomes a grade. Bands must cover 0–100 in whole marks.">
          {grading.data.configured || canEdit ? (
            <GradingEditor key={JSON.stringify(grading.data.bands)} grading={grading.data} canEdit={canEdit} />
          ) : (
            <p className="text-sm text-slate-gray">Not set up yet.</p>
          )}
        </Card>
      </div>
      {!canEdit && <p className="text-xs text-slate-gray">Only the principal (or another results administrator) can change these.</p>}
    </div>
  );
}
