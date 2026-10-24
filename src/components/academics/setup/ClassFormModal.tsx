"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { errorMessage } from "@/lib/api-client";
import { useCreateClass, useUpdateClass } from "@/lib/queries/academics";
import { classFormSchema, type ClassFormValues } from "@/lib/validation/academics";
import type { SchoolClass } from "@/types/academics";

interface ClassFormModalProps {
  /** Omitted when creating. */
  schoolClass?: SchoolClass;
  /** Prefilled level when creating, e.g. one above the highest existing class. */
  suggestedLevel?: number;
  onClose: () => void;
}

export function ClassFormModal({ schoolClass, suggestedLevel, onClose }: ClassFormModalProps) {
  const isEdit = !!schoolClass;
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: schoolClass?.name ?? "",
      level: schoolClass?.level ?? suggestedLevel,
    },
  });

  async function onSubmit(values: ClassFormValues) {
    setServerError(null);
    try {
      if (schoolClass) await updateClass.mutateAsync({ id: schoolClass.id, input: values });
      else await createClass.mutateAsync(values);
      onClose();
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  return (
    <Modal title={isEdit ? "Edit Class" : "New Class"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Class Name *" placeholder="e.g. JSS1" error={errors.name?.message} {...register("name")} />

        <div>
          <Input
            label="Level *"
            type="number"
            min={1}
            max={20}
            placeholder="e.g. 1"
            error={errors.level?.message}
            {...register("level", { valueAsNumber: true })}
          />
          {!errors.level && (
            <p className="mt-1.5 text-xs text-slate-gray">
              The class&apos;s rank in the school (JSS1 = 1 … SS3 = 6). Each class needs its own level;
              promotion moves students up one level.
            </p>
          )}
        </div>

        <FormError message={serverError} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Create Class"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
