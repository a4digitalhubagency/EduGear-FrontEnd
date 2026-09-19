"use client";

import { TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmPromotionModalProps {
  /** e.g. "JSS 2A (2025/2026)" */
  fromLabel: string;
  /** e.g. "JSS 3A" */
  toLabel: string;
  newSession: string;
  studentCount: number;
  isConfirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * "Confirm Student Promotion" modal from the "Student Promotion -
 * Operational States" reference screen. Gates the (mock) bulk-promote
 * action, since it's described as updating enrollment records for every
 * selected student — same "confirm before an irreversible-feeling bulk
 * action" pattern as RemoveGuardianDialog.
 */
export function ConfirmPromotionModal({
  fromLabel,
  toLabel,
  newSession,
  studentCount,
  isConfirming,
  onCancel,
  onConfirm,
}: ConfirmPromotionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-navy/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-primary-navy">Confirm Student Promotion</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-slate-gray hover:text-primary-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-gray">
          You are about to promote students from{" "}
          <span className="font-semibold text-primary-navy">{fromLabel}</span> to{" "}
          <span className="font-semibold text-primary-navy">
            {toLabel} ({newSession})
          </span>
          . This operation will update enrollment records for all selected students.
        </p>

        <dl className="mt-4 space-y-2 rounded-lg bg-cloud-sky/30 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-gray">Number of students</dt>
            <dd className="font-semibold text-primary-navy">{studentCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-gray">Destination</dt>
            <dd className="font-semibold text-primary-navy">{toLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-gray">New Session</dt>
            <dd className="font-semibold text-primary-navy">{newSession}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="w-auto flex-1"
            onClick={onCancel}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            className="w-auto flex-1"
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            Confirm &amp; Promote
          </Button>
        </div>
      </div>
    </div>
  );
}