"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api-client";
import { useChangeStudentStatus } from "@/lib/queries/students";
import { STUDENT_STATUS_LABELS } from "@/lib/student-labels";
import { changeStatusSchema, type ChangeStatusValues } from "@/lib/validation/student";
import { STUDENT_STATUSES, type Student } from "@/types/students";

/**
 * Change a student's status (PATCH /students/:id/status). Status has its own endpoint
 * so the change is audited as a status change, with the reason on the audit entry.
 */
export function ChangeStatusModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const change = useChangeStudentStatus();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<ChangeStatusValues>({
    resolver: zodResolver(changeStatusSchema),
    defaultValues: { status: student.status, reason: "" },
  });

  async function onSubmit({ status, reason }: ChangeStatusValues) {
    setServerError(null);
    try {
      await change.mutateAsync({ id: student.id, input: { status, ...(reason ? { reason } : {}) } });
      onClose();
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  return (
    <Modal title="Change Status" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <SelectField label="Status" {...register("status")}>
          {STUDENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STUDENT_STATUS_LABELS[s]}
            </option>
          ))}
        </SelectField>
        <Textarea label="Reason" rows={3} maxLength={255} placeholder="e.g. Transferred to another school" {...register("reason")} />
        <p className="text-xs text-slate-gray">
          Only Active students appear in class lists, registers and fee runs. The record and its history are kept.
        </p>
        <FormError message={serverError} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={isSubmitting} disabled={!isDirty}>
            Save Status
          </Button>
        </div>
      </form>
    </Modal>
  );
}
