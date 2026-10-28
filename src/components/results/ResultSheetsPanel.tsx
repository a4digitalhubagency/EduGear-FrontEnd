"use client";

import { useState } from "react";
import { ArrowLeft, Calculator, CheckCircle2, FileText, MessageSquare, Printer, Send, TriangleAlert, Undo2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingText, Pill, RetryButton, TABLE_CARD, TABLE_HEAD_ROW, TABLE_ROW, TableStateRow } from "@/components/ui/table";
import { TERM_LABELS } from "@/components/academics/setup/shared";
import { ReasonModal } from "@/components/finance/ReasonModal";
import { ReportCardsModal } from "@/components/results/ReportCardsModal";
import { errorMessage } from "@/lib/api-client";
import { useClassArms, useTerms } from "@/lib/queries/academics";
import { useComputeSheet, useResultSheet, useResultSheets, useReturnSheet, useSheetAction, useSheetComment, type SheetAction } from "@/lib/queries/results";
import { useCan } from "@/lib/store/auth-store";
import { formatRelativeTime } from "@/lib/utils";
import type { ResultSheet, ResultSheetStatus } from "@/types/results";

export const SHEET_STATUS_STYLES: Record<ResultSheetStatus, string> = {
  DRAFT: "bg-slate-gray/10 text-slate-gray",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-cloud-sky text-bright-blue",
  PUBLISHED: "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<ResultSheetStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Awaiting Approval",
  APPROVED: "Approved",
  PUBLISHED: "Published",
};

/** Edit one student's comments. Form teacher until approval; principal until publication. */
function CommentModal({ sheet, studentId, onClose }: { sheet: ResultSheet; studentId: string; onClose: () => void }) {
  const isHead = useCan("results.publish");
  const comment = useSheetComment();
  const student = sheet.students.find((s) => s.studentId === studentId)!;
  const [teacher, setTeacher] = useState(student.formTeacherComment ?? "");
  const [principal, setPrincipal] = useState(student.principalComment ?? "");
  const [error, setError] = useState<string | null>(null);
  const teacherOpen = sheet.status === "DRAFT" || sheet.status === "SUBMITTED";
  const principalOpen = isHead && sheet.status !== "PUBLISHED";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await comment.mutateAsync({
        id: sheet.id,
        studentId,
        input: {
          ...(teacherOpen ? { formTeacherComment: teacher.trim() || null } : {}),
          ...(principalOpen ? { principalComment: principal.trim() || null } : {}),
        },
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title={`Comments · ${student.studentName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Textarea
          label="Form Teacher's Comment"
          rows={3}
          maxLength={500}
          value={teacher}
          disabled={!teacherOpen}
          onChange={(e) => setTeacher(e.target.value)}
          placeholder="e.g. A diligent student who participates well in class."
        />
        <Textarea
          label="Principal's Comment"
          rows={3}
          maxLength={500}
          value={principal}
          disabled={!principalOpen}
          onChange={(e) => setPrincipal(e.target.value)}
          placeholder={isHead ? "e.g. Keep it up." : "Only the principal can write this."}
        />
        <p className="text-xs text-slate-gray">Form teachers can comment until approval; the principal until publication.</p>
        <FormError message={error} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={comment.isPending}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={comment.isPending} disabled={!teacherOpen && !principalOpen}>
            Save Comments
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SheetDetail({ sheetId, onBack }: { sheetId: string; onBack: () => void }) {
  const isHead = useCan("results.publish");
  const canUpdate = useCan("results.update");
  const sheet = useResultSheet(sheetId);
  const compute = useComputeSheet();
  const action = useSheetAction();
  const returnSheet = useReturnSheet();
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [commenting, setCommenting] = useState<string | null>(null);
  const [cards, setCards] = useState<{ studentId?: string } | null>(null);

  if (sheet.isPending) return <p className="rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray"><LoadingText label="Loading results..." /></p>;
  if (sheet.isError) {
    return (
      <p className="rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
        {errorMessage(sheet.error)}
        <RetryButton onRetry={() => sheet.refetch()} />
      </p>
    );
  }
  const s = sheet.data;

  function run(promise: Promise<unknown>) {
    setError(null);
    promise.catch((err) => setError(errorMessage(err)));
  }
  const act = (a: SheetAction) => run(action.mutateAsync({ id: s.id, action: a }));
  const busy = compute.isPending || action.isPending;

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-gray hover:text-primary-navy">
        <ArrowLeft className="h-4 w-4" />
        All classes
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-primary-navy">
            {s.className}
            <Pill className={SHEET_STATUS_STYLES[s.status]}>{STATUS_LABEL[s.status]}</Pill>
          </h2>
          <p className="text-sm text-slate-gray">
            {TERM_LABELS[s.termName as keyof typeof TERM_LABELS] ?? s.termName}, {s.sessionName} · {s.studentCount} students
            {s.computedAt && ` · computed ${formatRelativeTime(s.computedAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.status === "DRAFT" && canUpdate && (
            <Button type="button" variant="secondary" className="w-auto px-3 py-2" isLoading={compute.isPending} disabled={busy} onClick={() => run(compute.mutateAsync({ classArmId: s.classArmId, termId: s.termId }))}>
              <Calculator className="h-4 w-4" />
              Recompute
            </Button>
          )}
          {s.status === "DRAFT" && canUpdate && (
            <Button type="button" className="w-auto px-3 py-2" disabled={!s.ready || busy} title={s.ready ? undefined : "Every score must be in first"} onClick={() => act("submit")}>
              <Send className="h-4 w-4" />
              Submit for Approval
            </Button>
          )}
          {s.status === "SUBMITTED" && isHead && (
            <Button type="button" className="w-auto px-3 py-2" isLoading={action.isPending} onClick={() => act("approve")}>
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
          )}
          {s.status === "APPROVED" && isHead && (
            <Button type="button" className="w-auto px-3 py-2" isLoading={action.isPending} onClick={() => act("publish")}>
              <Upload className="h-4 w-4" />
              Publish to Parents
            </Button>
          )}
          {s.status !== "DRAFT" && isHead && (
            <Button type="button" variant="secondary" className="w-auto px-3 py-2" disabled={busy} onClick={() => setReturning(true)}>
              <Undo2 className="h-4 w-4" />
              Return to Draft
            </Button>
          )}
          <Button type="button" variant="tonal" className="w-auto px-3 py-2" onClick={() => setCards({})} disabled={s.students.length === 0}>
            <Printer className="h-4 w-4" />
            Report Cards
          </Button>
        </div>
      </div>
      {s.status === "DRAFT" && canUpdate && !s.ready && (
        // Said out loud, not only in the button's tooltip: phones can't hover, and a greyed-out button looks broken.
        <p className="text-sm text-slate-gray">
          <span className="font-semibold text-primary-navy">Submit for Approval</span> unlocks once every score below is entered.
          After entering them, click <span className="font-semibold text-primary-navy">Recompute</span>.
        </p>
      )}

      {error && <FormError message={error} />}
      {s.stale && s.status === "DRAFT" && (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-primary-navy">
          <TriangleAlert className="h-4 w-4 text-amber-600" />
          Scores have changed since these results were computed. Recompute before submitting.
        </p>
      )}
      {s.returnedReason && s.status === "DRAFT" && (
        <p className="rounded-lg bg-slate-gray/5 px-3 py-2 text-sm text-slate-gray">
          <span className="font-semibold text-primary-navy">Returned:</span> {s.returnedReason}
        </p>
      )}

      {s.status === "DRAFT" && s.missing.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-primary-navy">
            {s.missing.length} missing score{s.missing.length === 1 ? "" : "s"} before these results can be submitted
          </p>
          <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-xs text-slate-gray">
            {s.missing.map((m) => (
              <li key={`${m.studentId}-${m.subjectId}`}>
                <span className="font-semibold text-primary-navy">{m.studentName}</span> · {m.subjectName}: {m.components.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={TABLE_CARD}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Pos.</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Average</th>
              <th className="px-4 py-3">Passed</th>
              <th className="px-4 py-3">Comments</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {s.students.length === 0 ? (
              <TableStateRow colSpan={7}>No students in these results.</TableStateRow>
            ) : (
              s.students.map((st) => (
                <tr key={st.studentId} className={TABLE_ROW}>
                  <td className="px-4 py-3 font-bold text-primary-navy">{st.positionLabel ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary-navy">{st.studentName}</p>
                    <p className="text-xs text-slate-gray">{st.admissionNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-gray">{st.totalScore}</td>
                  <td className="px-4 py-3 font-semibold text-primary-navy">{st.averageScore.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-slate-gray">
                    {st.passes} / {st.subjectCount}
                    {st.failures > 0 && <span className="text-xs text-red-600"> ({st.failures} failed)</span>}
                  </td>
                  <td className="max-w-56 px-4 py-3 text-xs text-slate-gray">
                    {st.formTeacherComment || st.principalComment ? (
                      <span className="line-clamp-2">{[st.formTeacherComment, st.principalComment].filter(Boolean).join(" · ")}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {canUpdate && s.status !== "PUBLISHED" && (
                        <button type="button" onClick={() => setCommenting(st.studentId)} aria-label={`Comments for ${st.studentName}`} title="Comments" className="rounded-md p-1.5 text-slate-gray hover:bg-cloud-sky/60 hover:text-bright-blue">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      )}
                      <button type="button" onClick={() => setCards({ studentId: st.studentId })} aria-label={`Report card for ${st.studentName}`} title="Report card" className="rounded-md p-1.5 text-slate-gray hover:bg-cloud-sky/60 hover:text-bright-blue">
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {s.subjects.length > 0 && (
        <div className={TABLE_CARD}>
          <h3 className="px-5 pt-4 text-sm font-bold text-primary-navy">Subject Figures</h3>
          <table className="mt-2 w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className={TABLE_HEAD_ROW}>
                <th className="px-5 py-2.5">Subject</th>
                <th className="px-5 py-2.5">Students</th>
                <th className="px-5 py-2.5">Highest</th>
                <th className="px-5 py-2.5">Lowest</th>
                <th className="px-5 py-2.5">Average</th>
              </tr>
            </thead>
            <tbody>
              {s.subjects.map((sub) => (
                <tr key={sub.subjectId} className={TABLE_ROW}>
                  <td className="px-5 py-2.5 font-semibold text-primary-navy">{sub.subjectName}</td>
                  <td className="px-5 py-2.5 text-slate-gray">{sub.studentCount}</td>
                  <td className="px-5 py-2.5 text-slate-gray">{sub.highest}</td>
                  <td className="px-5 py-2.5 text-slate-gray">{sub.lowest}</td>
                  <td className="px-5 py-2.5 text-slate-gray">{sub.average}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {commenting && <CommentModal sheet={s} studentId={commenting} onClose={() => setCommenting(null)} />}
      {cards && <ReportCardsModal sheetId={s.id} studentId={cards.studentId} onClose={() => setCards(null)} />}
      {returning && (
        <ReasonModal
          title="Return Results to Draft"
          description={
            <>
              {s.className}&apos;s results go back to draft so scores can be corrected.
              {s.status === "PUBLISHED" && " They'll be withdrawn from the parent portal until republished."}
            </>
          }
          confirmLabel="Return to Draft"
          tone="danger"
          onConfirm={({ reason }) => returnSheet.mutateAsync({ id: s.id, reason })}
          onClose={() => setReturning(false)}
        />
      )}
    </div>
  );
}

/**
 * Result Sheets: every arm's results for a term and where each stands
 * (Draft → Awaiting Approval → Approved → Published), then one class's broadsheet with
 * the workflow actions. Buttons follow the backend's rules: the form teacher (or
 * principal) computes, submits and comments; the principal (results.publish) approves,
 * publishes and returns. The backend enforces it either way.
 */
export function ResultSheetsPanel() {
  const canUpdate = useCan("results.update");
  const terms = useTerms();
  const termList = terms.data?.data ?? [];
  const [pickedTerm, setPickedTerm] = useState<string | null>(null);
  const termId = pickedTerm ?? termList.find((t) => t.isCurrent)?.id ?? termList[termList.length - 1]?.id;
  const [statusFilter, setStatusFilter] = useState<ResultSheetStatus | "">("");
  const arms = useClassArms();
  const sheets = useResultSheets({ termId });
  const compute = useComputeSheet();
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (openId) return <SheetDetail sheetId={openId} onBack={() => setOpenId(null)} />;

  const byArm = new Map((sheets.data?.data ?? []).map((sh) => [sh.classArmId, sh]));
  const rows = (arms.data?.data ?? [])
    .map((arm) => ({ arm, sheet: byArm.get(arm.id) }))
    .filter((r) => !statusFilter || r.sheet?.status === statusFilter);

  async function computeFor(classArmId: string) {
    if (!termId) return;
    setError(null);
    try {
      const sheet = await compute.mutateAsync({ classArmId, termId });
      setOpenId(sheet.id);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={termId ?? ""} onChange={(e) => setPickedTerm(e.target.value)} aria-label="Term" disabled={termList.length === 0}>
          {termList.length === 0 && <option value="">No terms yet</option>}
          {termList.map((t) => (
            <option key={t.id} value={t.id}>
              {TERM_LABELS[t.name]}, {t.sessionName}
              {t.isCurrent ? " (current)" : ""}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ResultSheetStatus | "")} aria-label="Status">
          <option value="">All classes</option>
          {(Object.keys(STATUS_LABEL) as ResultSheetStatus[]).map((st) => (
            <option key={st} value={st}>
              {STATUS_LABEL[st]}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      )}

      <div className={`mt-4 ${TABLE_CARD}`}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Last Computed</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {arms.isPending || sheets.isPending ? (
              <TableStateRow colSpan={5}>
                <LoadingText label="Loading results..." />
              </TableStateRow>
            ) : sheets.isError ? (
              <TableStateRow colSpan={5}>
                {errorMessage(sheets.error)}
                <RetryButton onRetry={() => sheets.refetch()} />
              </TableStateRow>
            ) : rows.length === 0 ? (
              <TableStateRow colSpan={5}>{statusFilter ? "No classes with that status." : "No classes yet."}</TableStateRow>
            ) : (
              rows.map(({ arm, sheet }) => (
                <tr key={arm.id} className={TABLE_ROW}>
                  <td className="px-4 py-3 font-semibold text-primary-navy">{arm.fullName}</td>
                  <td className="px-4 py-3">
                    {sheet ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Pill className={SHEET_STATUS_STYLES[sheet.status]}>{STATUS_LABEL[sheet.status]}</Pill>
                        {sheet.stale && sheet.status === "DRAFT" && <span className="text-xs font-medium text-amber-700">needs recompute</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-gray">Not computed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-gray">{sheet?.studentCount ?? arm.studentCount}</td>
                  <td className="px-4 py-3 text-slate-gray">{sheet?.computedAt ? formatRelativeTime(sheet.computedAt) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {sheet ? (
                      <Button type="button" variant="ghost" className="w-auto px-3 py-1.5" onClick={() => setOpenId(sheet.id)}>
                        Open
                      </Button>
                    ) : canUpdate ? (
                      <Button
                        type="button"
                        variant="tonal"
                        className="w-auto px-3 py-1.5"
                        disabled={compute.isPending || arm.studentCount === 0}
                        title={arm.studentCount === 0 ? "No active students in this arm" : undefined}
                        onClick={() => computeFor(arm.id)}
                      >
                        <Calculator className="h-4 w-4" />
                        Compute
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-gray">
        Compute a class once its scores are in. The form teacher (or principal) computes and submits; the principal approves and
        publishes to parents.
      </p>
    </div>
  );
}
