"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Filter, RotateCcw, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmPromotionModal } from "@/components/academics/ConfirmPromotionModal";
import { PromotionStatusBadge } from "@/components/academics/PromotionStatusBadge";
import { getInitials } from "@/lib/utils";
import {
  NEXT_CLASS,
  PROMOTION_ARM_OPTIONS,
  PROMOTION_CLASS_OPTIONS,
  PROMOTION_SESSION_OPTIONS,
  findPromotionRoster,
} from "@/lib/mock-promotion";
import type { PromotionCandidate } from "@/types/promotion";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
];

interface LoadedRoster {
  className: string;
  arm: string;
  session: string;
}

interface CompletedPromotion {
  count: number;
  from: string;
  to: string;
  session: string;
}

/**
 * "Student Promotion" screen — the "Setup & List (Desktop)" screen plus
 * the "Confirm Student Promotion" modal from "Operational States".
 *
 * "Load Roster" looks up a mock roster for the chosen Current Class/Arm
 * (only JSS 2 / A is seeded, see mock-promotion.ts — any other combination
 * loads an empty table). Rows marked "Ineligible" can't be checked;
 * "Eligible" rows are pre-checked on load, "Pending Review" rows are not.
 * "Promote Selected" opens the confirm modal; confirming simulates the
 * bulk-promote call and swaps the roster for a "Promotion Complete" summary
 * card, same "load -> act -> confirm -> success" shape as the Attendance
 * Register's save flow.
 *
 * "Save Draft" and "Filter" are inert affordances — no design exists yet
 * for a saved-draft state or a filter panel, same treatment as other
 * not-yet-designed controls elsewhere (e.g. "More Actions" on Student
 * Profile). The Eligible/Pending Review/Ineligible split is fixed per mock
 * candidate rather than computed from a real promotion policy — that logic
 * arrives once the backend is wired up.
 */
export   function StudentPromotionView() {
  const [session, setSession] = useState(PROMOTION_SESSION_OPTIONS[0]);
  const [newSession, setNewSession] = useState(PROMOTION_SESSION_OPTIONS[1]);
  const [currentClass, setCurrentClass] = useState("");
  const [currentArm, setCurrentArm] = useState("");
  const [destClass, setDestClass] = useState("");
  const [destArm, setDestArm] = useState("");
  const [search, setSearch] = useState("");

  const [roster, setRoster] = useState<PromotionCandidate[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<LoadedRoster | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [completed, setCompleted] = useState<CompletedPromotion | null>(null);
  const [showDraftToast, setShowDraftToast] = useState(false);

  function handleCurrentClassChange(value: string) {
    setCurrentClass(value);
    if (!destClass) setDestClass(NEXT_CLASS[value] ?? "");
  }

  function handleCurrentArmChange(value: string) {
    setCurrentArm(value);
    if (!destArm) setDestArm(value);
  }

  function handleLoadRoster() {
    const found = findPromotionRoster(currentClass, currentArm);
    setRoster(found);
    setSelectedIds(new Set(found.filter((c) => c.status === "eligible").map((c) => c.id)));
    setLoadedFor({ className: currentClass, arm: currentArm, session });
    setCompleted(null);
    setSearch("");
  }

  const filteredRoster = useMemo(() => {
    if (!roster) return [];
    const query = search.trim().toLowerCase();
    if (!query) return roster;
    return roster.filter(
      (c) => c.name.toLowerCase().includes(query) || c.displayId.toLowerCase().includes(query),
    );
  }, [roster, search]);

  const selectableIds = filteredRoster.filter((c) => c.status !== "ineligible").map((c) => c.id);
  const allSelectableChecked = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  function toggleSelectAll() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelectableChecked) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleRow(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirmPromotion() {
    setIsConfirming(true);
    // TODO: wire up to the real EduGear "promote students" endpoint once the backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsConfirming(false);
    setShowConfirm(false);
    setCompleted({
      count: selectedIds.size,
      from: `${loadedFor?.className} ${loadedFor?.arm}`,
      to: `${destClass} ${destArm}`,
      session: newSession,
    });
    setRoster(null);
    setSelectedIds(new Set());
  }

  function handleSaveDraft() {
    setShowDraftToast(true);
    setTimeout(() => setShowDraftToast(false), 3000);
  }

  function handleStartNewPromotion() {
    setCompleted(null);
    setCurrentClass("");
    setCurrentArm("");
    setDestClass("");
    setDestArm("");
    setRoster(null);
    setLoadedFor(null);
  }

  const canLoad = currentClass !== "" && currentArm !== "";
  const fromLabel = loadedFor ? `${loadedFor.className} ${loadedFor.arm} (${loadedFor.session})` : "";
  const toLabel = destClass && destArm ? `${destClass} ${destArm}` : "";

  return (
    <div>
      <div>
        <p className="text-sm text-slate-gray">
          <span className="text-primary-navy">Academics</span> / Promotion
        </p>
        <h1 className="mt-1 text-2xl font-bold text-primary-navy">Student Promotion</h1>
        <p className="mt-1 text-sm text-slate-gray">
          Promote students to their next academic level and update enrollment records for the
          upcoming academic session.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-5">
        <h2 className="text-sm font-bold text-primary-navy">Promotion Setup</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-gray">Academic Session</label>
            <div className="mt-1.5 flex items-center gap-2">
              <Select value={session} onChange={(e) => setSession(e.target.value)} className="flex-1">
                {PROMOTION_SESSION_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-gray/60" />
              <Select value={newSession} onChange={(e) => setNewSession(e.target.value)} className="flex-1">
                {PROMOTION_SESSION_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </div>
            <span className="mt-1 block text-[11px] text-slate-gray">Current session → New academic session</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-gray">Class / Arm</label>
            <div className="mt-1.5 flex items-center gap-2">
              <Select
                value={currentClass}
                onChange={(e) => handleCurrentClassChange(e.target.value)}
                className="flex-1"
              >
                <option value="">Class</option>
                {PROMOTION_CLASS_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
              <Select value={currentArm} onChange={(e) => handleCurrentArmChange(e.target.value)} className="w-20">
                <option value="">Arm</option>
                {PROMOTION_ARM_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-gray/60" />
              <Select value={destClass} onChange={(e) => setDestClass(e.target.value)} className="flex-1">
                <option value="">Class</option>
                {PROMOTION_CLASS_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
              <Select value={destArm} onChange={(e) => setDestArm(e.target.value)} className="w-20">
                <option value="">Arm</option>
                {PROMOTION_ARM_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </div>
            <span className="mt-1 block text-[11px] text-slate-gray">Current class/arm → Destination class/arm</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={handleLoadRoster} disabled={!canLoad} className="w-auto px-5 py-2.5">
            <RotateCcw className="h-4 w-4" />
            Load Roster
          </Button>
        </div>
      </div>

      {completed ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-primary-navy">Promotion Complete</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-gray">
            {completed.count} student{completed.count === 1 ? "" : "s"} promoted from {completed.from} to{" "}
            {completed.to} for the {completed.session} session.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mx-auto mt-4 w-auto px-4 py-2.5"
            onClick={handleStartNewPromotion}
          >
            Start New Promotion
          </Button>
        </div>
      ) : roster === null ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-gray/20 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-primary-navy">No Roster Loaded</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-gray">
            Select a Current Class and Arm above, then click &ldquo;Load Roster&rdquo; to review
            eligible students.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-gray/10 p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-primary-navy">
                  {loadedFor?.className} {loadedFor?.arm} Roster
                </h2>
                <span className="rounded-full bg-cloud-sky px-2.5 py-1 text-xs font-semibold text-bright-blue">
                  {roster.length} Students
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px] flex-1">
                  <Input
                    icon={Search}
                    placeholder="Search student name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="py-2.5"
                  />
                </div>
                <Button type="button" variant="ghost" className="w-auto px-3 py-2.5">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-gray/10 text-xs font-semibold uppercase tracking-wide text-slate-gray">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all eligible students"
                      checked={allSelectableChecked}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-gray/40"
                    />
                  </th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Academic Performance</th>
                  <th className="px-4 py-3">Promotion Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-gray">
                      No students found for this class and arm.
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((candidate, index) => {
                    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                    const disabled = candidate.status === "ineligible";
                    return (
                      <tr key={candidate.id} className="border-b border-slate-gray/10 last:border-0">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${candidate.name}`}
                            checked={selectedIds.has(candidate.id)}
                            disabled={disabled}
                            onChange={() => toggleRow(candidate.id)}
                            className="h-4 w-4 rounded border-slate-gray/40 disabled:opacity-40"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor}`}
                            >
                              {getInitials(candidate.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-primary-navy">{candidate.name}</p>
                              <p className="text-xs text-slate-gray">
                                {loadedFor?.className} {loadedFor?.arm}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-gray">{candidate.displayId}</td>
                        <td className="px-4 py-3 text-slate-gray">
                          {candidate.averageScore}% - {candidate.performanceLabel}
                        </td>
                        <td className="px-4 py-3">
                          <PromotionStatusBadge status={candidate.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="secondary" className="w-auto px-4 py-2.5" onClick={handleSaveDraft}>
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              type="button"
              className="w-auto px-4 py-2.5"
              disabled={selectedIds.size === 0}
              onClick={() => setShowConfirm(true)}
            >
              Promote Selected ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmPromotionModal
          fromLabel={fromLabel}
          toLabel={toLabel}
          newSession={newSession}
          studentCount={selectedIds.size}
          isConfirming={isConfirming}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmPromotion}
        />
      )}

      {showDraftToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-primary-navy px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <Save className="h-4 w-4 text-cloud-sky" />
          Draft saved.
        </div>
      )}
    </div>
  );
}