"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Guardian } from "@/types/student";

interface RemoveGuardianDialogProps {
  guardian: Guardian;
  studentName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** "Remove Guardian?" confirmation, from the "Guardian Management - Interaction States" screen. */
export function RemoveGuardianDialog({
  guardian,
  studentName,
  onCancel,
  onConfirm,
}: RemoveGuardianDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-navy/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <TriangleAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-primary-navy">Remove Guardian?</h2>
        <p className="mt-1.5 text-sm text-slate-gray">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-primary-navy">{guardian.name}</span> as a guardian for{" "}
          {studentName}? This action cannot be undone.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}