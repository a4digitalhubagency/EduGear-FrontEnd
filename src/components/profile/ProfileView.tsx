"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, KeyRound, LogOut, MonitorSmartphone, School } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormError } from "@/components/ui/FormError";
import { PasswordInput } from "@/components/ui/Input";
import { LoadingText, PageHeader, Pill } from "@/components/ui/table";
import { api, errorMessage, jsonBody, passwordErrorMessage } from "@/lib/api-client";
import { newPasswordSchema } from "@/lib/validation/auth";
import { logout, logoutEverywhere, switchSchool } from "@/lib/auth-actions";
import { useAuthStore } from "@/lib/store/auth-store";
import type { AuthUser, MembershipSummary } from "@/lib/store/auth-store";

type Profile = { user: AuthUser; activeSchool: MembershipSummary; memberships: MembershipSummary[]; permissions: string[] };

/** ChangePasswordDto, with the backend's password policy (10-128 characters, a letter and a number). */
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a different password" });

type PasswordValues = z.infer<typeof passwordSchema>;

function Card({ title, icon: Icon, children }: { title: string; icon: typeof KeyRound; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-bright-blue" />
        <h2 className="text-sm font-bold text-primary-navy">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ChangePasswordCard() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit({ currentPassword, newPassword }: PasswordValues) {
    setServerError(null);
    try {
      await api("/auth/change-password", jsonBody("POST", { currentPassword, newPassword }));
      // The backend revokes every session on a password change, this one included.
      await logout();
      router.replace("/login");
    } catch (err) {
      setServerError(passwordErrorMessage(err));
    }
  }

  return (
    <Card title="Change Password" icon={KeyRound}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <PasswordInput label="Current Password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
        <PasswordInput label="New Password" autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
        <PasswordInput label="Confirm New Password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <p className="text-xs text-slate-gray">
          At least 10 characters, with a letter and a number. Changing it signs you out on every device, including
          this one.
        </p>
        <FormError message={serverError} />
        <Button type="submit" className="w-auto px-6" isLoading={isSubmitting}>
          Change Password
        </Button>
      </form>
    </Card>
  );
}

/**
 * My Profile (IA: Profile → My Profile, Change Password, Logout). Account details come
 * from GET /auth/me and are read-only: the backend has no endpoint for staff to edit their
 * own name or phone; an administrator changes those. Notifications aren't here because the
 * backend only notifies parents.
 */
export function ProfileView() {
  const router = useRouter();
  const activeSchoolId = useAuthStore((s) => s.activeSchool?.schoolId);
  const me = useQuery({ queryKey: ["auth", "me"], queryFn: () => api<Profile>("/auth/me") });
  const [confirmEverywhere, setConfirmEverywhere] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  async function handleSwitch(schoolId: string) {
    setSwitching(schoolId);
    setSwitchError(null);
    try {
      const permissions = await switchSchool(schoolId);
      router.replace(permissions.includes("portal.access") ? "/portal" : "/dashboard");
    } catch (err) {
      setSwitchError(errorMessage(err));
      setSwitching(null);
    }
  }

  const p = me.data;

  return (
    <div>
      <PageHeader title="My Profile" description="Your account, the schools you belong to, and your sign-in security." />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title="Account" icon={CheckCircle2}>
            {me.isPending ? (
              <LoadingText label="Loading..." />
            ) : me.isError ? (
              <p className="text-sm text-slate-gray">{errorMessage(me.error)}</p>
            ) : p ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-gray">Name</dt>
                  <dd className="font-semibold text-primary-navy">
                    {p.user.firstName} {p.user.lastName}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-gray">Email</dt>
                  <dd className="flex items-center gap-2 break-all text-right font-semibold text-primary-navy">
                    {p.user.email}
                    {p.user.emailVerified ? (
                      <Pill className="bg-green-100 text-green-700">Verified</Pill>
                    ) : (
                      <Pill className="bg-amber-100 text-amber-700">Unverified</Pill>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-gray">Phone</dt>
                  <dd className="font-semibold text-primary-navy">{p.user.phone ?? "—"}</dd>
                </div>
                <p className="pt-1 text-xs text-slate-gray">To change your name or phone, ask your school administrator.</p>
              </dl>
            ) : null}
          </Card>

          <Card title="Schools" icon={School}>
            {p && (
              <ul className="space-y-2">
                {p.memberships.map((m) => {
                  const current = m.schoolId === activeSchoolId;
                  return (
                    <li key={m.membershipId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-gray/10 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-primary-navy">{m.schoolName}</p>
                        <p className="text-xs text-slate-gray">{m.roleName}</p>
                      </div>
                      {current ? (
                        <Pill className="bg-green-100 text-green-700">Current</Pill>
                      ) : m.isActive ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-auto px-3 py-1.5"
                          onClick={() => handleSwitch(m.schoolId)}
                          isLoading={switching === m.schoolId}
                          disabled={!!switching}
                        >
                          Switch
                        </Button>
                      ) : (
                        <Pill className="bg-slate-gray/10 text-slate-gray">Inactive</Pill>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {switchError && (
              <div className="mt-3">
                <FormError message={switchError} />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <ChangePasswordCard />

          <Card title="Signed-in Devices" icon={MonitorSmartphone}>
            <p className="text-sm text-slate-gray">
              Lost a phone or signed in on a shared computer? Sign out everywhere, including here. You&apos;ll need your
              password to sign back in.
            </p>
            <Button type="button" variant="danger" className="mt-4 w-auto px-4" onClick={() => setConfirmEverywhere(true)}>
              <LogOut className="h-4 w-4" />
              Sign Out of All Devices
            </Button>
          </Card>
        </div>
      </div>

      {confirmEverywhere && (
        <ConfirmDialog
          title="Sign Out Everywhere?"
          description="Every session on every device ends now, including this one."
          confirmLabel="Sign Out All"
          onConfirm={async () => {
            await logoutEverywhere();
            router.replace("/login");
          }}
          onClose={() => setConfirmEverywhere(false)}
        />
      )}
    </div>
  );
}
