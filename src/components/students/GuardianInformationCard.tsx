"use client";

import { useState } from "react";
import { Briefcase, Mail, MapPin, Phone, Plus, ShieldUser } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GuardianFormModal } from "@/components/students/GuardianFormModal";
import { RemoveGuardianDialog } from "@/components/students/RemoveGuardianDialog";
import { getInitials } from "@/lib/utils";
import type { GuardianFormValues } from "@/lib/validation/student";
import type { Guardian } from "@/types/student";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
];

function generateGuardianId() {
  return `g-${Math.random().toString(36).slice(2, 9)}`;
}

interface GuardianInformationCardProps {
  studentName: string;
  guardians: Guardian[];
}

/**
 * "Student Profile - Guardian Information (Desktop)" screen — the
 * Guardians tab. Renders every guardian as a card (avatar, Primary badge,
 * relationship, phone/email/address/occupation, Set as Primary/Edit
 * Details/Remove), plus the "+ Add Guardian" button and the Add/Edit and
 * Remove modals from "Guardian Management - Interaction States".
 *
 * Owns its own guardian list locally, seeded from the student's mock data
 * — there's no backend yet, and per the "no shared client-side state"
 * decision each screen keeps its own state. That means adding, editing, or
 * removing a guardian here won't be reflected on the Overview tab's
 * Guardian Details card or the Edit Student form (both still read the
 * single guardianName/guardianRelationship/phone/guardianEmail fields on
 * StudentProfile) until the backend is wired up and there's one source of
 * truth — a known, documented gap rather than an oversight.
 */
export function GuardianInformationCard({
  studentName,
  guardians: initialGuardians,
}: GuardianInformationCardProps) {
  const [guardians, setGuardians] = useState<Guardian[]>(initialGuardians);
  const [formModal, setFormModal] = useState<{ mode: "add" | "edit"; guardian?: Guardian } | null>(
    null,
  );
  const [removingGuardian, setRemovingGuardian] = useState<Guardian | null>(null);

  function handleSaveGuardian(values: GuardianFormValues) {
    setGuardians((current) => {
      const withoutPrimaryClash = values.isPrimary
        ? current.map((g) => ({ ...g, isPrimary: false }))
        : current;

      if (formModal?.mode === "edit" && formModal.guardian) {
        const editingId = formModal.guardian.id;
        return withoutPrimaryClash.map((g) =>
          g.id === editingId ? { ...values, id: editingId } : g,
        );
      }

      return [...withoutPrimaryClash, { ...values, id: generateGuardianId() }];
    });
    setFormModal(null);
  }

  function handleSetPrimary(id: string) {
    setGuardians((current) => current.map((g) => ({ ...g, isPrimary: g.id === id })));
  }

  function handleRemove(guardian: Guardian) {
    setGuardians((current) => current.filter((g) => g.id !== guardian.id));
    setRemovingGuardian(null);
  }

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-primary-navy">
          <ShieldUser className="h-4 w-4 text-bright-blue" />
          Guardian Information
        </h2>
        <Button
          type="button"
          variant="tonal"
          className="w-auto px-3 py-2"
          onClick={() => setFormModal({ mode: "add" })}
        >
          <Plus className="h-4 w-4" />
          Add Guardian
        </Button>
      </div>

      {guardians.length === 0 ? (
        <p className="mt-4 text-sm text-slate-gray">No guardians on file yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {guardians.map((guardian, index) => (
            <div key={guardian.id} className="rounded-xl border border-slate-gray/10 p-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                >
                  {getInitials(guardian.name)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-primary-navy">{guardian.name}</p>
                    {guardian.isPrimary && (
                      <span className="rounded-full bg-cloud-sky px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bright-blue">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-gray">{guardian.relationship}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-gray">
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {guardian.phone}
                </p>
                {guardian.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {guardian.email}
                  </p>
                )}
                {guardian.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {guardian.address}
                  </p>
                )}
                {guardian.occupation && (
                  <p className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                    {guardian.occupation}
                  </p>
                )}
                {!guardian.email && !guardian.address && !guardian.occupation && (
                  <p>Additional details not provided.</p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {!guardian.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(guardian.id)}
                    className="text-xs font-semibold text-bright-blue hover:underline"
                  >
                    Set as Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFormModal({ mode: "edit", guardian })}
                  className="text-xs font-semibold text-bright-blue hover:underline"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => setRemovingGuardian(guardian)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formModal && (
        <GuardianFormModal
          mode={formModal.mode}
          guardian={formModal.guardian}
          onClose={() => setFormModal(null)}
          onSave={handleSaveGuardian}
        />
      )}

      {removingGuardian && (
        <RemoveGuardianDialog
          guardian={removingGuardian}
          studentName={studentName}
          onCancel={() => setRemovingGuardian(null)}
          onConfirm={() => handleRemove(removingGuardian)}
        />
      )}
    </div>
  );
}