"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  Download,
  Info,
  Pencil,
  Save,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AttendanceMarkToggle } from "@/components/academics/AttendanceMarkToggle";
import {
  ARM_OPTIONS_ATTENDANCE,
  CLASS_OPTIONS_ATTENDANCE,
  SESSION_OPTIONS_ATTENDANCE,
  TERM_OPTIONS_ATTENDANCE,
  buildDraftRoster,
  findAttendanceRegister,
} from "@/lib/mock-attendance";
import type { AttendanceEntry, AttendanceMark } from "@/types/attendance";

// Matches the one seeded "completed" register in mock-attendance.ts, so the
// page opens already showing that operational state once a class/arm is picked.
const DEFAULT_DATE = "2026-09-16";

const MARK_LABEL: Record<AttendanceMark, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

function formatNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * "Attendance" screen plus the "Attendance Register - Operational States"
 * reference screen. Filters (Session/Term/Class/Arm/Date) drive a lookup
 * against a small mock register store (`src/lib/mock-attendance.ts`):
 *
 * - No Class or Arm picked yet → "No Register Selected" empty state.
 * - A saved register already exists for that Class/Arm/Date → read-only
 *   Completed view (Present/Absent/Late summary, "Submitted by ... at
 *   ...", "Edit Attendance" to re-open it for editing).
 * - No saved register yet → the editable mark-attendance table, seeded
 *   from the same placeholder roster with each row's "Previous Day" mark
 *   shown for reference.
 *
 * Changing a filter while there are unsaved edits shows the "Unsaved
 * Changes Detected" banner (Discard / Save Changes) from the Operational
 * States screen instead of silently discarding the in-progress marks.
 * Session/Term don't affect the mock roster lookup (only Class/Arm/Date
 * do) — a documented simplification, same spirit as the shared roster
 * itself.
 */
export function AttendanceRegisterView() {
  const [session, setSession] = useState(SESSION_OPTIONS_ATTENDANCE[0]);
  const [term, setTerm] = useState(TERM_OPTIONS_ATTENDANCE[0]);
  const [className, setClassName] = useState("");
  const [arm, setArm] = useState("");
  const [date, setDate] = useState(DEFAULT_DATE);
  const [search, setSearch] = useState("");

  const [entries, setEntries] = useState<AttendanceEntry[] | null>(null);
  const [registerStatus, setRegisterStatus] = useState<"none" | "draft" | "completed">("none");
  const [submittedMeta, setSubmittedMeta] = useState<{ by: string; at: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [pendingChange, setPendingChange] = useState<(() => void) | null>(null);

  // Reload the register whenever the Class/Arm/Date combination changes.
  // This adjusts state during render (React's documented pattern for
  // resetting state when a prop/derived key changes) rather than in a
  // useEffect, which would cause an extra, avoidable re-render pass.
  const registerKey = className && arm ? `${className}-${arm}-${date}` : null;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  if (registerKey !== loadedKey) {
    setLoadedKey(registerKey);
    if (!registerKey) {
      setEntries(null);
      setRegisterStatus("none");
      setSubmittedMeta(null);
    } else {
      const existing = findAttendanceRegister(className, arm, date);
      if (existing) {
        setEntries(existing.entries);
        setRegisterStatus("completed");
        setSubmittedMeta({ by: existing.submittedBy ?? "Unknown", at: existing.submittedAt ?? "" });
      } else {
        setEntries(buildDraftRoster());
        setRegisterStatus("draft");
        setSubmittedMeta(null);
      }
    }
    setIsEditing(false);
    setIsDirty(false);
  }

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) || entry.displayId.toLowerCase().includes(query),
    );
  }, [entries, search]);

  const canEdit = registerStatus === "draft" || (registerStatus === "completed" && isEditing);

  function requestChange(apply: () => void) {
    if (isDirty) {
      setPendingChange(() => apply);
    } else {
      apply();
    }
  }

  function handleMark(id: string, mark: AttendanceMark) {
    setEntries((current) =>
      current
        ? current.map((entry) => (entry.id === id ? { ...entry, status: mark } : entry))
        : current,
    );
    setIsDirty(true);
  }

  function handleMarkAllPresent() {
    setEntries((current) =>
      current ? current.map((entry) => ({ ...entry, status: "present" as const })) : current,
    );
    setIsDirty(true);
  }

  async function handleSave() {
    setIsSaving(true);
    // TODO: wire up to the real EduGear "save attendance register" endpoint once the backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setRegisterStatus("completed");
    setSubmittedMeta({ by: "You", at: formatNow() });
    setIsEditing(false);
    setIsDirty(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    pendingChange?.();
    setPendingChange(null);
  }

  function handleDiscard() {
    pendingChange?.();
    setPendingChange(null);
    setIsDirty(false);
  }

  const presentCount = entries?.filter((e) => e.status === "present").length ?? 0;
  const absentCount = entries?.filter((e) => e.status === "absent").length ?? 0;
  const lateCount = entries?.filter((e) => e.status === "late").length ?? 0;
  const excusedCount = entries?.filter((e) => e.status === "excused").length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-gray">
            <span className="text-primary-navy">Academics</span> / Operations
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary-navy">Attendance</h1>
          <p className="mt-1 text-sm text-slate-gray">
            Record and monitor student attendance across your classes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="w-auto px-4 py-2.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {canEdit && (
            <Button
              type="button"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!entries}
              className="w-auto px-4 py-2.5"
            >
              <Save className="h-4 w-4" />
              Save Attendance
            </Button>
          )}
        </div>
      </div>

      {pendingChange && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-primary-navy">Unsaved Changes Detected</p>
              <p className="text-xs text-slate-gray">
                You have modified the register for {className || "this class"}
                {arm ? ` Arm ${arm}` : ""}. Do you want to save or discard before viewing your new
                selection?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-auto px-3 py-2"
              onClick={handleDiscard}
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="danger"
              className="w-auto px-3 py-2"
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          value={session}
          onChange={(e) => {
            const next = e.target.value;
            requestChange(() => setSession(next));
          }}
        >
          {SESSION_OPTIONS_ATTENDANCE.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select
          value={term}
          onChange={(e) => {
            const next = e.target.value;
            requestChange(() => setTerm(next));
          }}
        >
          {TERM_OPTIONS_ATTENDANCE.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select
          value={className}
          onChange={(e) => {
            const next = e.target.value;
            requestChange(() => setClassName(next));
          }}
        >
          <option value="" disabled>
            Select Class
          </option>
          {CLASS_OPTIONS_ATTENDANCE.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select
          value={arm}
          onChange={(e) => {
            const next = e.target.value;
            requestChange(() => setArm(next));
          }}
        >
          <option value="" disabled>
            Select Arm
          </option>
          {ARM_OPTIONS_ATTENDANCE.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            const next = e.target.value;
            requestChange(() => setDate(next));
          }}
        />
      </div>

      {registerStatus === "none" ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-gray/20 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
            <CalendarX className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-primary-navy">No Register Selected</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-gray">
            Please select a class and arm from the controls above to start recording attendance.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-gray/10 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-gray/10 p-4">
              <div className="min-w-[240px] flex-1">
                <Input
                  icon={Search}
                  placeholder="Search student name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="py-2.5"
                />
              </div>
              <div className="flex items-center gap-2">
                {registerStatus === "completed" && (
                  <span className="rounded-full bg-cloud-sky px-3 py-1 text-xs font-semibold text-bright-blue">
                    Completed
                  </span>
                )}
                {registerStatus === "completed" && !isEditing ? (
                  <Button
                    type="button"
                    variant="tonal"
                    className="w-auto px-3 py-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Attendance
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="tonal"
                    className="w-auto px-3 py-2"
                    onClick={handleMarkAllPresent}
                  >
                    Mark All Present
                  </Button>
                )}
              </div>
            </div>

            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-gray/10 text-xs font-semibold uppercase tracking-wide text-slate-gray">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Previous Day</th>
                  <th className="px-4 py-3">Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-gray">
                      No students match your search.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-gray/10 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-primary-navy">{entry.name}</p>
                        <p className="text-xs text-slate-gray">{entry.gender}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-gray">{entry.displayId}</td>
                      <td className="px-4 py-3 text-slate-gray">
                        {entry.previousDayStatus ? MARK_LABEL[entry.previousDayStatus] : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AttendanceMarkToggle
                          value={entry.status}
                          onChange={(mark) => handleMark(entry.id, mark)}
                          disabled={!canEdit}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {registerStatus === "completed" && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-gray/10 px-4 py-3 text-sm">
                <p className="text-slate-gray">
                  <span className="font-semibold text-green-700">{presentCount} Present</span> ·{" "}
                  <span className="font-semibold text-red-600">{absentCount} Absent</span> ·{" "}
                  <span className="font-semibold text-amber-600">{lateCount} Late</span>
                  {excusedCount > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-semibold text-bright-blue">
                        {excusedCount} Excused
                      </span>
                    </>
                  )}
                </p>
                {submittedMeta && (
                  <p className="text-xs text-slate-gray">
                    Submitted by {submittedMeta.by} at {submittedMeta.at}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-gray/10 bg-cloud-sky/20 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-bright-blue" />
            <div>
              <p className="text-sm font-semibold text-primary-navy">Daily Tip</p>
              <p className="text-xs text-slate-gray">
                Attendance records are locked 48 hours after the operational date. Contact
                personnel for historical edits.
              </p>
            </div>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-primary-navy px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          Attendance recorded successfully for {className} Arm {arm}.
        </div>
      )}
    </div>
  );
}