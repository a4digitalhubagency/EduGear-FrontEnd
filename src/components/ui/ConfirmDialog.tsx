"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { errorMessage } from "@/lib/api-client";

interface ConfirmDialogProps {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  /** Runs the action; the dialog shows its own spinner and keeps itself open with the error if it fails. */
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}

/** Destructive-action confirmation, same layout as RemoveGuardianDialog. */
export function ConfirmDialog({ title, description, confirmLabel = "Delete", onConfirm, onClose }: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // e.g. the backend refusing to delete a class that still has students
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
        <h2 className="mt-4 text-lg font-bold text-primary-navy">{title}</h2>
        <p className="mt-1.5 text-sm text-slate-gray">{description}</p>
        {error && (
          <div className="mt-4 text-left">
            <FormError message={error} />
          </div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} isLoading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
