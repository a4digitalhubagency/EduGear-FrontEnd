"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import { TERM_LABELS } from "@/components/academics/setup/shared";
import { errorMessage } from "@/lib/api-client";
import { useCreateTerm, useUpdateTerm } from "@/lib/queries/academics";
import { toDateInput } from "@/lib/utils";
import { termFormSchema, type TermFormValues } from "@/lib/validation/academics";
import { TERM_NAMES, type AcademicSession, type Term } from "@/types/academics";

interface TermFormModalProps {
  /** Omitted when creating. */
  term?: Term;
  sessions: AcademicSession[];
  /** Preselected session when creating (the panel's current filter). */
  defaultSessionId?: string;
  onClose: () => void;
}

export function TermFormModal({ term, sessions, defaultSessionId, onClose }: TermFormModalProps) {
  const isEdit = !!term;
  const createTerm = useCreateTerm();
  const updateTerm = useUpdateTerm();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TermFormValues>({
    resolver: zodResolver(termFormSchema),
    defaultValues: {
      sessionId: term?.sessionId ?? defaultSessionId ?? "",
      // The resolver rejects the "" placeholder, so the cast only covers the empty initial state.
      name: term?.name ?? ("" as TermFormValues["name"]),
      startDate: term ? toDateInput(term.startDate) : "",
      endDate: term ? toDateInput(term.endDate) : "",
      isCurrent: false,
    },
  });

  async function onSubmit({ sessionId, isCurrent, ...fields }: TermFormValues) {
    setServerError(null);
    try {
      // UpdateTermDto accepts neither sessionId (a term can't move) nor isCurrent.
      if (term) await updateTerm.mutateAsync({ id: term.id, input: fields });
      else await createTerm.mutateAsync({ sessionId, isCurrent, ...fields });
      onClose();
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  return (
    <Modal title={isEdit ? "Edit Term" : "New Term"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {isEdit ? (
          // Shown read-only: the backend doesn't allow moving a term to another session.
          <div>
            <p className="mb-1.5 text-sm font-semibold text-primary-navy">Session</p>
            <p className="rounded-lg bg-cloud-sky/30 px-3 py-3 text-sm text-primary-navy">{term.sessionName}</p>
          </div>
        ) : (
          <SelectField label="Session *" error={errors.sessionId?.message} {...register("sessionId")}>
            <option value="" disabled>
              Select session
            </option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
                {session.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>
        )}

        <SelectField label="Term *" error={errors.name?.message} {...register("name")}>
          <option value="" disabled>
            Select term
          </option>
          {TERM_NAMES.map((name) => (
            <option key={name} value={name}>
              {TERM_LABELS[name]}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Start Date *" type="date" error={errors.startDate?.message} {...register("startDate")} />
          <Input label="End Date *" type="date" error={errors.endDate?.message} {...register("endDate")} />
        </div>
        <p className="-mt-2 text-xs text-slate-gray">Term dates must fall within the session&apos;s dates.</p>

        {!isEdit && (
          <div>
            <Checkbox label="Make this the current term" {...register("isCurrent")} />
            <p className="mt-1 pl-6 text-xs text-slate-gray">Only a term of the current session can be current.</p>
          </div>
        )}

        <FormError message={serverError} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Create Term"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
