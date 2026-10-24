"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { errorMessage } from "@/lib/api-client";

interface RemoveGuardianDialogProps {
  guardianName: string;
  studentName: string;
  onCancel: () => void;
  /** Unlinks; the dialog stays open with the error if it fails. */
  onConfirm: () => Promise<unknown>;
}

/**
 * "Remove Guardian?" confirmation, from the "Guardian Management - Interaction States"
 * screen. Removing unlinks the guardian from this student only; their record (and any
 * other children's links) stays.
 */
export function RemoveGuardianDialog({ guardianName, studentName, onCancel, onConfirm }: RemoveGuardianDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onCancel();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center bg-primary-navy/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl animate-dialog-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <TriangleAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-primary-navy">Remove Guardian?</h2>
        <p className="mt-1.5 text-sm text-slate-gray">
          Remove <span className="font-semibold text-primary-navy">{guardianName}</span> as a guardian for {studentName}?
          Their record stays, along with any other children they&apos;re linked to.
        </p>
        {error && (
          <div className="mt-3 text-left">
            <FormError message={error} />
          </div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={confirm} isLoading={pending}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
