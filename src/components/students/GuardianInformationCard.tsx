"use client";

import { useState } from "react";
import { Mail, Phone, Plus, ShieldUser } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { GuardianFormModal } from "@/components/students/GuardianFormModal";
import { RemoveGuardianDialog } from "@/components/students/RemoveGuardianDialog";
import { errorMessage } from "@/lib/api-client";
import { useUnlinkGuardian, useUpdateGuardianLink } from "@/lib/queries/guardians";
import { useCan } from "@/lib/store/auth-store";
import { RELATIONSHIP_LABELS } from "@/lib/student-labels";
import { getInitials } from "@/lib/utils";
import type { StudentGuardianSummary } from "@/types/students";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
];

interface GuardianInformationCardProps {
  studentId: string;
  studentName: string;
  guardians: StudentGuardianSummary[];
}

/**
 * "Student Profile - Guardian Information (Desktop)": the Guardians tab, on the real
 * student profile. Every change goes to the backend (link, update link, unlink, update
 * guardian), and the profile refetches, so the Overview's Guardian Details card stays
 * in step. Needs guardians.update to change links (and guardians.create to add new ones).
 */
export function GuardianInformationCard({ studentId, studentName, guardians }: GuardianInformationCardProps) {
  const canLink = useCan("guardians.update");
  const updateLink = useUpdateGuardianLink();
  const unlink = useUnlinkGuardian();

  const [formModal, setFormModal] = useState<{ link?: StudentGuardianSummary } | null>(null);
  const [removing, setRemoving] = useState<StudentGuardianSummary | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function setPrimary(guardian: StudentGuardianSummary) {
    setActionError(null);
    // The backend allows one primary per student and moves the flag itself.
    updateLink.mutate(
      { studentId, guardianId: guardian.guardianId, input: { isPrimary: true } },
      { onError: (err) => setActionError(errorMessage(err)) },
    );
  }

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-primary-navy">
          <ShieldUser className="h-4 w-4 text-bright-blue" />
          Guardian Information
        </h2>
        {canLink && (
          <Button type="button" variant="tonal" className="w-auto px-3 py-2" onClick={() => setFormModal({})}>
            <Plus className="h-4 w-4" />
            Add Guardian
          </Button>
        )}
      </div>

      {actionError && (
        <div className="mt-3">
          <FormError message={actionError} />
        </div>
      )}

      {guardians.length === 0 ? (
        <p className="mt-4 text-sm text-slate-gray">No guardians on file yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {guardians.map((guardian, index) => (
            <div key={guardian.guardianId} className="rounded-xl border border-slate-gray/10 p-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                >
                  {getInitials(guardian.fullName)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-primary-navy">{guardian.fullName}</p>
                    {guardian.isPrimary && (
                      <span className="rounded-full bg-cloud-sky px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bright-blue">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-gray">
                    {RELATIONSHIP_LABELS[guardian.relationship]}
                    {guardian.canPickUp ? " · Can pick up" : " · Not allowed to pick up"}
                  </p>
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
              </div>

              {canLink && (
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {!guardian.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(guardian)}
                      disabled={updateLink.isPending}
                      className="text-xs font-semibold text-bright-blue hover:underline disabled:opacity-60"
                    >
                      Set as Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFormModal({ link: guardian })}
                    className="text-xs font-semibold text-bright-blue hover:underline"
                  >
                    Edit Details
                  </button>
                  <button type="button" onClick={() => setRemoving(guardian)} className="text-xs font-semibold text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formModal && (
        <GuardianFormModal
          studentId={studentId}
          link={formModal.link}
          linkedIds={guardians.map((g) => g.guardianId)}
          onClose={() => setFormModal(null)}
        />
      )}

      {removing && (
        <RemoveGuardianDialog
          guardianName={removing.fullName}
          studentName={studentName}
          onCancel={() => setRemoving(null)}
          onConfirm={() => unlink.mutateAsync({ studentId, guardianId: removing.guardianId })}
        />
      )}
    </div>
  );
}
