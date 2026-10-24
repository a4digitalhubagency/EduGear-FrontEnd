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
import { useInviteStaff, useUpdateMembership } from "@/lib/queries/users";
import { editStaffSchema, inviteStaffSchema, type EditStaffValues, type InviteStaffValues } from "@/lib/validation/personnel";
import type { Role } from "@/types/school";
import type { StaffMember } from "@/types/users";

/**
 * Roles a staff member can hold. Parent roles (portal.access) are excluded: parents get
 * portal logins from their guardian record, and staff tokens are refused on the portal.
 */
export function staffRoles(roles: Role[]) {
  return roles.filter((role) => !role.permissions.includes("portal.access"));
}

function FormButtons({ submitLabel, isSubmitting, onCancel }: { submitLabel: string; isSubmitting: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" className="w-auto flex-1" isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </div>
  );
}

export function InviteStaffModal({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  const invite = useInviteStaff();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteStaffValues>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: { email: "", firstName: "", lastName: "", roleId: "", phone: "", staffId: "" },
  });

  async function onSubmit({ phone, staffId, ...required }: InviteStaffValues) {
    setServerError(null);
    try {
      // Optional fields are omitted when empty: the DTO would reject "" for phone.
      await invite.mutateAsync({ ...required, ...(phone ? { phone } : {}), ...(staffId ? { staffId } : {}) });
      onClose();
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  return (
    <Modal title="Invite Staff Member" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <p className="text-sm text-slate-gray">
          They&apos;ll get an email to set a password. Someone who already uses EduGear at another school keeps
          their existing login.
        </p>
        <Input label="Email Address *" type="email" error={errors.email?.message} {...register("email")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First Name *" error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last Name *" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <SelectField label="Role *" error={errors.roleId?.message} {...register("roleId")}>
          <option value="" disabled>
            Select role
          </option>
          {staffRoles(roles).map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Phone" placeholder="08031234567" error={errors.phone?.message} {...register("phone")} />
          <Input label="Staff Number" placeholder="e.g. STF-014" error={errors.staffId?.message} {...register("staffId")} />
        </div>
        <FormError message={serverError} />
        <FormButtons submitLabel="Send Invitation" isSubmitting={isSubmitting} onCancel={onClose} />
      </form>
    </Modal>
  );
}

export function EditStaffModal({ member, roles, onClose }: { member: StaffMember; roles: Role[]; onClose: () => void }) {
  const update = useUpdateMembership();
  const [serverError, setServerError] = useState<string | null>(null);
  // Invited people have no status to toggle yet; revoked ones can't be edited at all (the list hides that).
  const canToggleStatus = member.status === "ACTIVE" || member.status === "SUSPENDED";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<EditStaffValues>({
    resolver: zodResolver(editStaffSchema),
    defaultValues: {
      roleId: member.roleId,
      status: member.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      staffId: member.staffId ?? "",
    },
  });

  async function onSubmit(values: EditStaffValues) {
    setServerError(null);
    try {
      // Only what changed, so an unchanged status on an invited member isn't sent.
      await update.mutateAsync({
        membershipId: member.membershipId,
        input: {
          ...(dirtyFields.roleId ? { roleId: values.roleId } : {}),
          ...(dirtyFields.status && canToggleStatus ? { status: values.status } : {}),
          ...(dirtyFields.staffId && values.staffId ? { staffId: values.staffId } : {}),
        },
      });
      onClose();
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  return (
    <Modal title={`Edit ${member.firstName} ${member.lastName}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <SelectField label="Role *" error={errors.roleId?.message} {...register("roleId")}>
          {staffRoles(roles).map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </SelectField>
        {canToggleStatus && (
          <div>
            <SelectField label="Status" error={errors.status?.message} {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </SelectField>
            <p className="mt-1.5 text-xs text-slate-gray">Suspended staff can&apos;t sign in until reactivated.</p>
          </div>
        )}
        <Input label="Staff Number" placeholder="e.g. STF-014" error={errors.staffId?.message} {...register("staffId")} />
        <FormError message={serverError} />
        <FormButtons submitLabel="Save Changes" isSubmitting={isSubmitting} onCancel={onClose} />
      </form>
    </Modal>
  );
}
