"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import { errorMessage } from "@/lib/api-client";
import { useCreateClassArm, useUpdateClassArm } from "@/lib/queries/academics";
import { useActiveStaff } from "@/lib/queries/users";
import { useCan } from "@/lib/store/auth-store";
import { armFormSchema, type ArmFormValues } from "@/lib/validation/academics";
import { MAX_ARM_CAPACITY, type ClassArm, type SchoolClass } from "@/types/academics";

interface ArmFormModalProps {
  schoolClass: SchoolClass;
  /** Omitted when creating. */
  arm?: ClassArm;
  onClose: () => void;
}

export function ArmFormModal({ schoolClass, arm, onClose }: ArmFormModalProps) {
  const isEdit = !!arm;
  const createArm = useCreateClassArm();
  const updateArm = useUpdateClassArm();
  const [serverError, setServerError] = useState<string | null>(null);

  // Listing staff needs users.read. Without it the picker is hidden and any existing
  // form teacher is left untouched (the field is simply not sent).
  const canPickTeacher = useCan("users.read");
  const staff = useActiveStaff(canPickTeacher);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArmFormValues>({
    resolver: zodResolver(armFormSchema),
    defaultValues: {
      name: arm?.name ?? "",
      capacity: arm?.capacity != null ? String(arm.capacity) : "",
      formTeacherId: arm?.formTeacherId ?? "",
    },
  });

  async function onSubmit({ name, capacity, formTeacherId }: ArmFormValues) {
    setServerError(null);
    const capacityNumber = capacity === "" ? null : Number(capacity);
    try {
      if (arm) {
        // On update, null clears a field (UpdateClassArmDto allows it).
        await updateArm.mutateAsync({
          id: arm.id,
          input: {
            name,
            capacity: capacityNumber,
            ...(canPickTeacher ? { formTeacherId: formTeacherId || null } : {}),
          },
        });
      } else {
        // On create, empty optional fields are omitted: CreateClassArmDto doesn't accept null.
        await createArm.mutateAsync({
          classId: schoolClass.id,
          name,
          ...(capacityNumber !== null ? { capacity: capacityNumber } : {}),
          ...(canPickTeacher && formTeacherId ? { formTeacherId } : {}),
        });
      }
      onClose();
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  // /users also lists parents (portal logins are memberships too); a parent can't be a form teacher.
  const staffList = (staff.data?.data ?? []).filter((m) => m.roleSlug !== "PARENT");
  // Keep the current teacher selectable even if they're no longer in the active list.
  const currentTeacherMissing = !!arm?.formTeacherId && !staffList.some((m) => m.membershipId === arm.formTeacherId);

  return (
    <Modal title={isEdit ? `Edit ${arm.fullName}` : `New Arm in ${schoolClass.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Arm Name *" placeholder="e.g. A" error={errors.name?.message} {...register("name")} />
          <Input
            label="Capacity"
            type="number"
            min={1}
            max={MAX_ARM_CAPACITY}
            placeholder="No limit"
            error={errors.capacity?.message}
            {...register("capacity")}
          />
        </div>

        {canPickTeacher && (
          <SelectField label="Form Teacher" disabled={staff.isPending} {...register("formTeacherId")}>
            <option value="">{staff.isPending ? "Loading staff..." : "No form teacher"}</option>
            {currentTeacherMissing && <option value={arm.formTeacherId!}>{arm.formTeacherName ?? "Current teacher"}</option>}
            {staffList.map((member) => (
              <option key={member.membershipId} value={member.membershipId}>
                {member.firstName} {member.lastName} · {member.roleName}
              </option>
            ))}
          </SelectField>
        )}
        {staff.isError && <FormError message={`Couldn't load staff: ${errorMessage(staff.error)}`} />}

        <FormError message={serverError} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={isSubmitting}>
            {isEdit ? "Save Changes" : "Create Arm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
