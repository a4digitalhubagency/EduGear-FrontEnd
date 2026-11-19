"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/table";
import { ApiError, errorMessage, passwordErrorMessage } from "@/lib/api-client";
import { platformApi } from "@/lib/queries/platform";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validation/auth";
import type { PlatformOperator } from "@/types/platform";

// Both forms call platformApi directly, not through a mutation: a wrong current password answers
// 401 INVALID_CREDENTIALS, which must show here rather than trip the console's "session ended" redirect.
const wrongPassword = (err: unknown) => err instanceof ApiError && err.errorCode === "INVALID_CREDENTIALS";

function CancelSubmit({ onClose, pending, label }: { onClose: () => void; pending: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-1">
      <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={pending}>
        Cancel
      </Button>
      <Button type="submit" className="w-auto flex-1" isLoading={pending}>
        {label}
      </Button>
    </div>
  );
}

/**
 * POST /platform/auth/change-password. A change revokes every platform session, the one that
 * made it included, so on success the caller drops the session and goes to sign-in.
 */
function PasswordForm({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
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
      setServerError(wrongPassword(err) ? "Your current password is incorrect." : passwordErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <PasswordInput label="Current Password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
      <PasswordInput label="New Password" autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
      <PasswordInput label="Confirm New Password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
      <p className="text-xs text-slate-gray">
        At least 10 characters, with a letter and a number. Changing it signs out every platform session, including this one.
      </p>
      <FormError message={serverError} />
      <CancelSubmit onClose={onClose} pending={isSubmitting} label="Change Password" />
    </form>
  );
}

const changeEmailSchema = z.object({
  newEmail: z.string().trim().min(1, "Enter the new email address").email("Enter a valid email address"),
  currentPassword: z.string().min(1, "Enter your current password"),
});
type ChangeEmailValues = z.infer<typeof changeEmailSchema>;

/**
 * POST /platform/auth/change-email answers 202: a confirmation link goes to the NEW address and
 * nothing changes until it's opened (/platform/confirm-email). Sessions stay signed in throughout.
 */
function EmailForm({ me, onClose }: { me: PlatformOperator; onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailValues>({ resolver: zodResolver(changeEmailSchema) });

  async function onSubmit({ newEmail, currentPassword }: ChangeEmailValues) {
    setServerError(null);
    if (newEmail.toLowerCase() === me.email.toLowerCase()) return setServerError("That's already this account's email.");
    try {
      await platformApi("/auth/change-email", { method: "POST", body: { currentPassword, newEmail } });
      setSentTo(newEmail);
    } catch (err) {
      setServerError(wrongPassword(err) ? "Your current password is incorrect." : errorMessage(err));
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-cloud-sky/40 px-3 py-3 text-sm text-primary-navy">
          We sent a confirmation link to <span className="font-semibold">{sentTo}</span>. Your email stays{" "}
          <span className="font-semibold">{me.email}</span> until that link is opened. The link expires in 15 minutes.
        </p>
        <Button type="button" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-sm text-slate-gray">
        Currently <span className="font-semibold text-primary-navy">{me.email}</span>. The confirmation goes to the new address, so a typo
        changes nothing.
      </p>
      {/* Password first, and no "email" autocomplete hint: an email field followed by a password field reads as a
          sign-in form, and Chrome fills the saved login into it, putting the current address in New Email. */}
      <PasswordInput label="Current Password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
      <Input label="New Email" icon={Mail} type="email" autoComplete="off" error={errors.newEmail?.message} {...register("newEmail")} />
      <FormError message={serverError} />
      <CancelSubmit onClose={onClose} pending={isSubmitting} label="Send Confirmation" />
    </form>
  );
}

/** The signed-in operator's own account: password and sign-in email. */
export function PlatformAccountModal({ me, onClose, onPasswordChanged }: { me: PlatformOperator; onClose: () => void; onPasswordChanged: () => void }) {
  const [tab, setTab] = useState<"Password" | "Email">("Password");
  return (
    <Modal title="Your Account" onClose={onClose}>
      <div className="-mt-5 mb-5">
        <Tabs tabs={["Password", "Email"] as const} active={tab} onChange={setTab} />
      </div>
      {tab === "Password" ? <PasswordForm onClose={onClose} onChanged={onPasswordChanged} /> : <EmailForm me={me} onClose={onClose} />}
    </Modal>
  );
}
