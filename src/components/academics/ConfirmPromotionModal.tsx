"use client";

import { TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

interface ConfirmPromotionModalProps {
  /** e.g. "JSS 2 A" */
  fromLabel: string;
  /** e.g. "JSS 3 A"; null when graduating. */
  toLabel: string | null;
  studentCount: number;
  isConfirming: boolean;
  /** The backend's refusal (e.g. the destination arm is full), shown in place. */
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * "Confirm Student Promotion" modal from the "Student Promotion - Operational States"
 * reference screen. Gates the bulk move, which updates every selected student's class
 * at once; worded for graduation when the students are leaving instead.
 */
export function ConfirmPromotionModal({
  fromLabel,
  toLabel,
  studentCount,
  isConfirming,
  error,
  onCancel,
  onConfirm,
}: ConfirmPromotionModalProps) {
  const graduating = toLabel === null;
  const students = `${studentCount} student${studentCount === 1 ? "" : "s"}`;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-primary-navy/40 p-4">
      <div className="w-full max-w-md animate-dialog-in rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-primary-navy">
              {graduating ? "Confirm Graduation" : "Confirm Student Promotion"}
            </h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-slate-gray hover:text-primary-navy">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-gray">
          {graduating ? (
            <>
              You are about to graduate {students} from <span className="font-semibold text-primary-navy">{fromLabel}</span>.
              They&apos;ll be marked Graduated and leave the class roll; their records are kept.
            </>
          ) : (
            <>
              You are about to move {students} from <span className="font-semibold text-primary-navy">{fromLabel}</span> to{" "}
              <span className="font-semibold text-primary-navy">{toLabel}</span>. This updates the class on every selected
              student&apos;s record.
            </>
          )}
        </p>

        <dl className="mt-4 space-y-2 rounded-lg bg-cloud-sky/30 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-gray">Number of students</dt>
            <dd className="font-semibold text-primary-navy">{studentCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-gray">From</dt>
            <dd className="font-semibold text-primary-navy">{fromLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-gray">{graduating ? "Outcome" : "Destination"}</dt>
            <dd className="font-semibold text-primary-navy">{toLabel ?? "Graduated"}</dd>
          </div>
        </dl>

        {error && (
          <div className="mt-4">
            <FormError message={error} />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onCancel} disabled={isConfirming}>
            Cancel
          </Button>
          <Button type="button" variant="danger" className="w-auto flex-1" onClick={onConfirm} isLoading={isConfirming}>
            {graduating ? "Confirm & Graduate" : "Confirm & Promote"}
          </Button>
        </div>
      </div>
    </div>
  );
}
