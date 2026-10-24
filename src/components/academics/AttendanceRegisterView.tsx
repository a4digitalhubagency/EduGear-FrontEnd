"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarX, CheckCircle2, Info, Lock, Pencil, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingText, RetryButton } from "@/components/ui/table";
import { AttendanceMarkToggle } from "@/components/academics/AttendanceMarkToggle";
import { ArmOptions } from "@/components/students/ArmOptions";
import { errorMessage } from "@/lib/api-client";
import { useClassArms, useCurrentTerm } from "@/lib/queries/academics";
import { useRegister, useSaveRegister } from "@/lib/queries/attendance";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatDate, toDateInput, todayInput } from "@/lib/utils";
import type { Term } from "@/types/academics";
import type { AttendanceStatus, Register } from "@/types/attendance";

const MARK_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

type Mark = { status: AttendanceStatus | null; note: string };

/** The weekday before a "YYYY-MM-DD" date (Friday for a Monday), for the Previous Day column. */
function previousWeekday(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  do d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

function marksFrom(register: Register): Record<string, Mark> {
  return Object.fromEntries(register.students.map((s) => [s.studentId, { status: s.status, note: s.note ?? "" }]));
}

/** Why a register can't be edited, from what the backend tells us about it. */
function lockedReason(register: Register, date: string, currentTerm: Term | null | undefined) {
  if (date > todayInput()) return "Registers can't be taken for future dates.";
  if (!register.termName) {
    const range = currentTerm ? ` The current term runs ${formatDate(currentTerm.startDate)} to ${formatDate(currentTerm.endDate)}.` : "";
    return `This date isn't inside any term, so it isn't a school day.${range}`;
  }
  return `Only the form teacher of ${register.className} (or an administrator) can take or change this register.`;
}

/**
 * Today if it's inside the current term; otherwise the last term day that isn't in the
 * future (or the term's first day, for a term that hasn't started). Opening on a day
 * the register can actually be taken saves a confusing "not a school day" first view.
 */
function defaultDate(term: Term | null | undefined) {
  const today = todayInput();
  if (!term) return today;
  const start = toDateInput(term.startDate);
  const end = toDateInput(term.endDate);
  if (today < start) return start;
  return today > end ? end : today;
}

/**
 * "Attendance" screen plus "Attendance Register - Operational States", on
 * GET/PUT /attendance/register. Pick an arm and a date (the term comes from the date,
 * so the design's Session/Term pickers are gone); form teachers open on their own arm.
 * Whether the register can be edited is the backend's call (canEdit): form teacher or
 * academics.update, a term day, not in the future. When it can't, the page says why.
 */
export function AttendanceRegisterView() {
  const myMembershipId = useAuthStore((s) => s.activeSchool?.membershipId);
  const arms = useClassArms();
  const myArm = (arms.data?.data ?? []).find((arm) => arm.formTeacherId && arm.formTeacherId === myMembershipId);

  // null until picked, so a form teacher's own arm can be the default once arms load.
  const [pickedArm, setPickedArm] = useState<string | null>(null);
  const classArmId = pickedArm ?? myArm?.id ?? "";
  const currentTerm = useCurrentTerm();
  // null until picked, so the default can follow the current term once it loads.
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const date = pickedDate ?? defaultDate(currentTerm.data);
  const [search, setSearch] = useState("");

  const register = useRegister(classArmId || undefined, date);
  const previous = useRegister(classArmId || undefined, previousWeekday(date));
  const save = useSaveRegister();

  // Local marks: reset whenever a different register (or a fresh copy of it) arrives.
  // Adjusting state during render is React's documented pattern for resetting on a key change.
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  if (register.data && register.dataUpdatedAt !== loadedFor) {
    setLoadedFor(register.dataUpdatedAt);
    setMarks(marksFrom(register.data));
    setIsEditing(!register.data.taken && register.data.canEdit);
    setIsDirty(false);
  }

  const [pendingChange, setPendingChange] = useState<(() => void) | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const data = register.data;
  const editable = !!data?.canEdit && isEditing;

  const rows = useMemo(() => {
    const list = data?.students ?? [];
    const query = search.trim().toLowerCase();
    return query
      ? list.filter((s) => s.studentName.toLowerCase().includes(query) || s.admissionNumber.toLowerCase().includes(query))
      : list;
  }, [data, search]);

  const previousMarks = useMemo(
    () => new Map((previous.data?.taken ? previous.data.students : []).map((s) => [s.studentId, s.status])),
    [previous.data],
  );

  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, unmarked: 0 };
    for (const s of data?.students ?? []) {
      const status = marks[s.studentId]?.status;
      if (status) c[status] += 1;
      else c.unmarked += 1;
    }
    return c;
  }, [data, marks]);

  function requestChange(apply: () => void) {
    if (isDirty) setPendingChange(() => apply);
    else apply();
  }

  function setMark(studentId: string, patch: Partial<Mark>) {
    setMarks((current) => ({ ...current, [studentId]: { ...{ status: null, note: "" }, ...current[studentId], ...patch } }));
    setIsDirty(true);
  }

  function markAllPresent() {
    setMarks((current) =>
      Object.fromEntries((data?.students ?? []).map((s) => [s.studentId, { status: "PRESENT" as const, note: current[s.studentId]?.note ?? "" }])),
    );
    setIsDirty(true);
  }

  async function handleSave() {
    if (!data) return;
    setSaveError(null);
    const entries = data.students.flatMap((s) => {
      const mark = marks[s.studentId];
      if (!mark?.status) return [];
      const note = mark.status === "PRESENT" ? null : mark.note.trim() || null;
      return [{ studentId: s.studentId, status: mark.status, note }];
    });
    if (entries.length === 0) {
      setSaveError("Mark at least one student before saving.");
      return;
    }
    try {
      await save.mutateAsync({ classArmId: data.classArmId, date, entries });
      setToast(`Attendance recorded for ${data.className} on ${formatDate(date)}.`);
      setTimeout(() => setToast(null), 3000);
      pendingChange?.();
      setPendingChange(null);
    } catch (err) {
      setSaveError(errorMessage(err));
    }
  }

  function handleDiscard() {
    if (data) setMarks(marksFrom(data));
    setIsDirty(false);
    setIsEditing(!!data && !data.taken && data.canEdit);
    pendingChange?.();
    setPendingChange(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-gray">
            <span className="text-primary-navy">Academics</span> / Operations
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary-navy">Attendance</h1>
          <p className="mt-1 text-sm text-slate-gray">Record and monitor student attendance across your classes.</p>
        </div>

        {editable && (
          <Button type="button" onClick={handleSave} isLoading={save.isPending} disabled={!isDirty} className="w-auto px-4 py-2.5">
            <Save className="h-4 w-4" />
            Save Attendance
          </Button>
        )}
      </div>

      {pendingChange && (
        <div className="mt-4 flex animate-fade-in flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-primary-navy">Unsaved Changes Detected</p>
              <p className="text-xs text-slate-gray">
                You have changed the register for {data?.className ?? "this class"}. Save or discard before viewing your new selection?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="w-auto px-3 py-2" onClick={handleDiscard}>
              Discard
            </Button>
            <Button type="button" variant="danger" className="w-auto px-3 py-2" onClick={handleSave} isLoading={save.isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
        <Select
          className="w-full"
          value={classArmId}
          onChange={(e) => {
            const next = e.target.value;
            requestChange(() => setPickedArm(next));
          }}
          aria-label="Class and arm"
        >
          <ArmOptions emptyLabel="Select class and arm" />
        </Select>
        <Input
          type="date"
          value={date}
          max={todayInput()}
          onChange={(e) => {
            const next = e.target.value;
            if (next) requestChange(() => setPickedDate(next));
          }}
          aria-label="Date"
        />
      </div>

      {!classArmId ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-gray/20 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
            <CalendarX className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-primary-navy">No Register Selected</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-gray">Select a class and arm above to start recording attendance.</p>
        </div>
      ) : register.isPending ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          <LoadingText label="Loading register..." />
        </div>
      ) : register.isError ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center text-sm text-slate-gray">
          {errorMessage(register.error)}
          <RetryButton onRetry={() => register.refetch()} />
        </div>
      ) : data ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-gray">
            <span className="font-semibold text-primary-navy">{data.className}</span> · {formatDate(date)}
            {data.termName ? ` · ${data.termName.charAt(0) + data.termName.slice(1).toLowerCase()} Term` : ""}
          </p>

          {!data.canEdit && (
            <div className="flex items-start gap-2.5 rounded-lg bg-slate-gray/5 p-3 text-sm text-slate-gray">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              {lockedReason(data, date, currentTerm.data)}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-gray/10 p-4">
              <div className="min-w-[240px] flex-1">
                <Input icon={Search} placeholder="Search student name or admission no..." value={search} onChange={(e) => setSearch(e.target.value)} className="py-2.5" />
              </div>
              <div className="flex items-center gap-2">
                {data.taken && (
                  <span className="rounded-full bg-cloud-sky px-3 py-1 text-xs font-semibold text-bright-blue">Completed</span>
                )}
                {data.canEdit &&
                  (isEditing ? (
                    <Button type="button" variant="tonal" className="w-auto px-3 py-2" onClick={markAllPresent} disabled={data.students.length === 0}>
                      Mark All Present
                    </Button>
                  ) : (
                    <Button type="button" variant="tonal" className="w-auto px-3 py-2" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4" />
                      Edit Attendance
                    </Button>
                  ))}
              </div>
            </div>

            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-gray/10 text-xs font-semibold uppercase tracking-wide text-slate-gray">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Admission No.</th>
                  <th className="px-4 py-3">Previous Day</th>
                  <th className="px-4 py-3">Attendance Status</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {data.students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-gray">
                      No active students in {data.className} yet.
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-gray">
                      No students match your search.
                    </td>
                  </tr>
                ) : (
                  rows.map((s) => {
                    const mark = marks[s.studentId] ?? { status: null, note: "" };
                    const prev = previousMarks.get(s.studentId);
                    return (
                      <tr key={s.studentId} className="border-b border-slate-gray/10 last:border-0">
                        <td className="px-4 py-3 font-semibold text-primary-navy">{s.studentName}</td>
                        <td className="px-4 py-3 text-slate-gray">{s.admissionNumber}</td>
                        <td className="px-4 py-3 text-slate-gray">{prev ? MARK_LABEL[prev] : "—"}</td>
                        <td className="px-4 py-3">
                          <AttendanceMarkToggle value={mark.status} onChange={(status) => setMark(s.studentId, { status })} disabled={!editable} />
                        </td>
                        <td className="px-4 py-3">
                          {mark.status && mark.status !== "PRESENT" ? (
                            editable ? (
                              <input
                                value={mark.note}
                                maxLength={255}
                                onChange={(e) => setMark(s.studentId, { note: e.target.value })}
                                placeholder="Reason (optional)"
                                aria-label={`Note for ${s.studentName}`}
                                className="w-full min-w-40 rounded-md border border-slate-gray/20 px-2 py-1.5 text-xs text-primary-navy focus:border-bright-blue focus:outline-none"
                              />
                            ) : (
                              <span className="text-xs text-slate-gray">{mark.note || "—"}</span>
                            )
                          ) : (
                            <span className="text-xs text-slate-gray">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {data.students.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-gray/10 px-4 py-3 text-sm">
                <p className="text-slate-gray">
                  <span className="font-semibold text-green-700">{counts.PRESENT} Present</span> ·{" "}
                  <span className="font-semibold text-red-600">{counts.ABSENT} Absent</span> ·{" "}
                  <span className="font-semibold text-amber-600">{counts.LATE} Late</span> ·{" "}
                  <span className="font-semibold text-bright-blue">{counts.EXCUSED} Excused</span>
                  {counts.unmarked > 0 && <span className="text-slate-gray"> · {counts.unmarked} not marked</span>}
                </p>
                {data.taken && !isDirty && <p className="text-xs text-slate-gray">Register taken for this day.</p>}
              </div>
            )}
          </div>

          {saveError && <FormError message={saveError} />}
          {editable && counts.unmarked > 0 && isDirty && (
            <p className="text-xs text-amber-700">
              {counts.unmarked} student{counts.unmarked === 1 ? " is" : "s are"} not marked; they&apos;ll stay unmarked if you save now.
            </p>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-slate-gray/10 bg-cloud-sky/20 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-bright-blue" />
            <div>
              <p className="text-sm font-semibold text-primary-navy">How registers work</p>
              <p className="text-xs text-slate-gray">
                Each arm&apos;s form teacher (or an administrator) takes its register, for school days inside a term and never
                for a future date. A taken register can be amended the same way.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex animate-dialog-in items-center gap-2 rounded-xl bg-primary-navy px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
