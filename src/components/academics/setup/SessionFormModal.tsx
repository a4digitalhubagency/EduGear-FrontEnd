"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { errorMessage } from "@/lib/api-client";
import { useCreateSession, useUpdateSession } from "@/lib/queries/academics";
import { toDateInput } from "@/lib/utils";
import { sessionFormSchema, type SessionFormValues } from "@/lib/validation/academics";
import type { AcademicSession } from "@/types/academics";

interface SessionFormModalProps {
  /** Omitted when creating. */
  session?: AcademicSession;
  onClose: () => void;
}

export function SessionFormModal({ session, onClose }: SessionFormModalProps) {
  const isEdit = !!session;
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      name: session?.name ?? "",
      startDate: session ? toDateInput(session.startDate) : "",
      endDate: session ? toDateInput(session.endDate) : "",
      isCurrent: false,
    },
  });

  async function onSubmit({ isCurrent, ...fields }: SessionFormValues) {
    setServerError(null);
    try {
      // UpdateAcademicSessionDto has no isCurrent (that's what "Make current" is for), and
      // forbidNonWhitelisted would reject it, so it is only sent on create.
      if (session) await updateSession.mutateAsync({ id: session.id, input: fields });
      else await createSession.mutateAsync({ ...fields, isCurrent });
      onClose();
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  return (
    <Modal title={isEdit ? "Edit Session" : "New Academic Session"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Session Name *" placeholder="e.g. 2025/2026" error={errors.name?.message} {...register("name")} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Start Date *" type="date" error={errors.startDate?.message} {...register("startDate")} />
          <Input label="End Date *" type="date" error={errors.endDate?.message} {...register("endDate")} />
        </div>

        {!isEdit && <Checkbox label="Make this the current session" {...register("isCurrent")} />}

        <FormError message={serverError} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Create Session"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
