"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { PasswordInput } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ApiError, passwordErrorMessage } from "@/lib/api-client";
import { platformApi } from "@/lib/queries/platform";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validation/auth";

/**
 * POST /platform/auth/change-password. A change revokes every platform session, the one
 * that made it included, so on success the caller signs out and goes to sign-in.
 * Called through platformApi directly, not a mutation: a wrong current password answers
 * 401, which must show here rather than trip the console's "session ended" redirect.
 */
export function PlatformPasswordModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit({ currentPassword, newPassword }: ChangePasswordValues) {
    setServerError(null);
    try {
      await platformApi("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
      onChanged();
    } catch (err) {
      // 401 here is the current password being wrong (or the session ending, which the next request will reveal).
      setServerError(err instanceof ApiError && err.status === 401 ? "Your current password is incorrect." : passwordErrorMessage(err));
    }
  }

  return (
    <Modal title="Change Password" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <PasswordInput label="Current Password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
        <PasswordInput label="New Password" autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
        <PasswordInput label="Confirm New Password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <p className="text-xs text-slate-gray">
          At least 10 characters, with a letter and a number. Changing it signs out every platform session, including
          this one.
        </p>
        <FormError message={serverError} />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={isSubmitting}>
            Change Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
