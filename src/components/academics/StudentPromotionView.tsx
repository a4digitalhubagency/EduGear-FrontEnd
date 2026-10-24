"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, GraduationCap, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingText, RetryButton } from "@/components/ui/table";
import { ConfirmPromotionModal } from "@/components/academics/ConfirmPromotionModal";
import { ArmOptions } from "@/components/students/ArmOptions";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { errorMessage } from "@/lib/api-client";
import { useClassArms } from "@/lib/queries/academics";
import { useLatestResultSheet } from "@/lib/queries/results";
import { useArmRoster, usePromoteStudents } from "@/lib/queries/students";
import { useCan } from "@/lib/store/auth-store";
import type { ClassArm } from "@/types/academics";
import type { PromotionResult } from "@/types/promotion";

/** Destination value meaning "graduate them" rather than an arm id. */
const GRADUATE = "__graduate";

/**
 * Suggested destination for a source arm: the same arm letter one class level up
 * (JSS 1 A -> JSS 2 A), else the first arm one level up, else graduation (top class).
 * Only a suggestion; the user can pick any arm.
 */
function suggestDestination(from: ClassArm, arms: ClassArm[]) {
  const nextLevel = arms.filter((a) => a.classLevel === from.classLevel + 1);
  if (nextLevel.length === 0) return arms.some((a) => a.classLevel > from.classLevel) ? "" : GRADUATE;
  return (nextLevel.find((a) => a.name === from.name) ?? nextLevel[0]).id;
}

/**
 * "Student Promotion" (Setup & List + the Confirm modal), on POST /students/promotions.
 * Pick a source arm and a destination arm (or graduation), load its Active students,
 * untick anyone repeating the class, and promote the rest in one transaction.
 *
 * Differences from the design: no session pickers (the backend moves students between
 * arms, independent of sessions); no Eligible/Pending/Ineligible column (the backend
 * has no promotion policy, and inventing a cut-off would be guessing a school's rules);
 * instead each student's average and position from the arm's latest result sheet.
 * Save Draft and Filter are gone; neither had anything behind it.
 */
export function StudentPromotionView() {
  const canPromote = useCan("students.update");
  const canReadResults = useCan("results.read");
  const arms = useClassArms();
  const armList = arms.data?.data ?? [];

  const [fromArmId, setFromArmId] = useState("");
  const [destination, setDestination] = useState("");
  const [loadedArmId, setLoadedArmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deselected, setDeselected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<PromotionResult | null>(null);

  const roster = useArmRoster(loadedArmId ?? undefined);
  const sheet = useLatestResultSheet(loadedArmId ?? undefined, canReadResults);
  const promote = usePromoteStudents();

  const fromArm = armList.find((a) => a.id === fromArmId);
  const loadedArm = armList.find((a) => a.id === loadedArmId);
  const destArm = armList.find((a) => a.id === destination);
  const graduating = destination === GRADUATE;

  const performance = useMemo(
    () => new Map((sheet.data?.students ?? []).map((s) => [s.studentId, s])),
    [sheet.data],
  );

  // Memoised so the empty fallback is one stable array, not a new one every render.
  const students = useMemo(() => roster.data ?? [], [roster.data]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? students.filter((s) => s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)) : students;
  }, [students, search]);
  // Everyone starts ticked; the list tracks who's been unticked (repeating the class).
  const selectedIds = students.filter((s) => !deselected.has(s.id)).map((s) => s.id);
  const allVisibleTicked = visible.length > 0 && visible.every((s) => !deselected.has(s.id));

  function pickFrom(id: string) {
    setFromArmId(id);
    const arm = armList.find((a) => a.id === id);
    setDestination(arm ? suggestDestination(arm, armList) : "");
  }

  function loadRoster() {
    setLoadedArmId(fromArmId);
    setDeselected(new Set());
    setCompleted(null);
    setSearch("");
  }

  function toggle(id: string) {
    setDeselected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setDeselected((current) => {
      const next = new Set(current);
      for (const s of visible) {
        if (allVisibleTicked) next.add(s.id);
        else next.delete(s.id);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!loadedArmId) return;
    setError(null);
    try {
      const result = await promote.mutateAsync({
        fromClassArmId: loadedArmId,
        ...(graduating ? { graduate: true } : { toClassArmId: destination }),
        studentIds: selectedIds,
      });
      setConfirming(false);
      setCompleted(result);
      setLoadedArmId(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const destinationInvalid = !destination || destination === loadedArmId;

  if (!canPromote) {
    return (
      <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-12 text-center text-sm text-slate-gray">
        You don&apos;t have permission to promote students.
      </div>
    );
  }

  return (
    <div>
      <div>
        <p className="text-sm text-slate-gray">
          <span className="text-primary-navy">Academics</span> / Promotion
        </p>
        <h1 className="mt-1 text-2xl font-bold text-primary-navy">Student Promotion</h1>
        <p className="mt-1 text-sm text-slate-gray">
          Move a class arm&apos;s students up to their next class, or graduate a final-year class.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-5">
        <h2 className="text-sm font-bold text-primary-navy">Promotion Setup</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label className="text-xs font-semibold text-slate-gray">From class / arm</label>
            <Select className="mt-1.5 w-full" value={fromArmId} onChange={(e) => pickFrom(e.target.value)} aria-label="From class and arm">
              <ArmOptions emptyLabel="Select current class and arm" />
            </Select>
          </div>
          <ArrowRight className="mb-3 h-4 w-4 shrink-0 text-slate-gray/60" />
          <div className="min-w-56 flex-1">
            <label className="text-xs font-semibold text-slate-gray">To class / arm</label>
            <Select
              className="mt-1.5 w-full"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              aria-label="Destination class and arm"
              disabled={!fromArmId}
            >
              <ArmOptions emptyLabel="Select destination" />
              <option value={GRADUATE}>Graduate (leave the school)</option>
            </Select>
          </div>
          <Button type="button" onClick={loadRoster} disabled={!fromArmId} className="w-auto px-5 py-2.5">
            <RotateCcw className="h-4 w-4" />
            Load Roster
          </Button>
        </div>
        {fromArm && destination && !graduating && destination === fromArmId && (
          <p className="mt-2 text-xs font-medium text-red-600">The destination must be a different arm.</p>
        )}
        {fromArm && destArm && destArm.classLevel <= fromArm.classLevel && destArm.id !== fromArm.id && (
          <p className="mt-2 text-xs text-amber-700">
            {destArm.fullName} isn&apos;t a higher class than {fromArm.fullName}. That&apos;s fine for moving students between
            arms; just check it&apos;s what you meant.
          </p>
        )}
      </div>

      {completed ? (
        <div className="mt-6 animate-fade-in-up rounded-xl border border-slate-gray/10 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            {completed.graduated ? <GraduationCap className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
          </div>
          <p className="mt-4 text-sm font-semibold text-primary-navy">{completed.graduated ? "Graduation Complete" : "Promotion Complete"}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-gray">
            {completed.graduated
              ? `${completed.graduated} student${completed.graduated === 1 ? "" : "s"} graduated from ${completed.from}.`
              : `${completed.promoted} student${completed.promoted === 1 ? "" : "s"} moved from ${completed.from} to ${completed.to}.`}
          </p>
          <div className="mx-auto mt-4 flex max-w-sm justify-center gap-3">
            <Button type="button" variant="secondary" className="w-auto flex-1 px-4 py-2.5" onClick={() => setCompleted(null)}>
              Start New Promotion
            </Button>
            <Link href="/students" className="flex-1">
              <Button type="button" className="w-full px-4 py-2.5">
                View Students
              </Button>
            </Link>
          </div>
        </div>
      ) : !loadedArmId ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-gray/20 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-primary-navy">No Roster Loaded</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-gray">
            Select the current class and arm above, then click &ldquo;Load Roster&rdquo; to review its students.
          </p>
        </div>
      ) : roster.isPending ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          <LoadingText label="Loading roster..." />
        </div>
      ) : roster.isError ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          {errorMessage(roster.error)}
          <RetryButton onRetry={() => roster.refetch()} />
        </div>
      ) : (
        <div className="mt-6 animate-fade-in-up space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-gray/10 p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-primary-navy">{loadedArm?.fullName} Roster</h2>
                <span className="rounded-full bg-cloud-sky px-2.5 py-1 text-xs font-semibold text-bright-blue">
                  {students.length} Active Student{students.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="min-w-[220px] flex-1 sm:max-w-xs">
                <Input icon={Search} placeholder="Search student name or admission no..." value={search} onChange={(e) => setSearch(e.target.value)} className="py-2.5" />
              </div>
            </div>

            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-gray/10 text-xs font-semibold uppercase tracking-wide text-slate-gray">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all shown students"
                      checked={allVisibleTicked}
                      onChange={toggleAllVisible}
                      disabled={visible.length === 0}
                      className="h-4 w-4 rounded border-slate-gray/40"
                    />
                  </th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Admission No.</th>
                  <th className="px-4 py-3">Academic Performance</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-gray">
                      {students.length === 0 ? `No active students in ${loadedArm?.fullName}.` : "No students match your search."}
                    </td>
                  </tr>
                ) : (
                  visible.map((s) => {
                    const result = performance.get(s.id);
                    return (
                      <tr key={s.id} className="border-b border-slate-gray/10 last:border-0">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${s.fullName}`}
                            checked={!deselected.has(s.id)}
                            onChange={() => toggle(s.id)}
                            className="h-4 w-4 rounded border-slate-gray/40"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/students/${s.id}`} className="flex items-center gap-2.5">
                            <StudentAvatar id={s.id} name={`${s.firstName} ${s.lastName}`} photoUrl={s.photoUrl} className="h-8 w-8 text-xs" />
                            <span className="font-semibold text-primary-navy hover:underline">{s.fullName}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-gray">{s.studentId}</td>
                        <td className="px-4 py-3 text-slate-gray">
                          {result
                            ? `${result.averageScore.toFixed(1)}% average${result.positionLabel ? ` · ${result.positionLabel}` : ""}`
                            : "No results yet"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {canReadResults && sheet.data && (
              <p className="border-t border-slate-gray/10 px-4 py-2.5 text-xs text-slate-gray">
                Performance from the {sheet.data.termName.charAt(0) + sheet.data.termName.slice(1).toLowerCase()} Term, {sheet.data.sessionName} results.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {deselected.size > 0 && (
              <p className="text-xs text-slate-gray">
                {deselected.size} unticked student{deselected.size === 1 ? "" : "s"} will stay in {loadedArm?.fullName}.
              </p>
            )}
            <Button
              type="button"
              className="w-auto px-4 py-2.5"
              disabled={selectedIds.length === 0 || destinationInvalid}
              title={destinationInvalid ? "Choose a different destination arm, or graduation" : undefined}
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
            >
              {graduating ? `Graduate Selected (${selectedIds.length})` : `Promote Selected (${selectedIds.length})`}
            </Button>
          </div>
        </div>
      )}

      {confirming && loadedArm && (
        <ConfirmPromotionModal
          fromLabel={loadedArm.fullName}
          toLabel={graduating ? null : (destArm?.fullName ?? "")}
          studentCount={selectedIds.length}
          isConfirming={promote.isPending}
          error={error}
          onCancel={() => setConfirming(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
