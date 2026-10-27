"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import {
  IconAction, LoadingText, Pill, RetryButton, TABLE_ROW,  TABLE_HEAD_ROW, TABLE_CARD,
} from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { useGrantPlatformAccess, usePlatformAdmins, useRevokePlatformAccess } from "@/lib/queries/platform";
import { cn, formatRelativeTime } from "@/lib/utils";
import { PLATFORM_ROLES, type PlatformAdmin, type PlatformOperator, type PlatformRole } from "@/types/platform";

const ROLE_HELP: Record<PlatformRole, string> = {
  SUPPORT: "Read-only: sees schools and their usage",
  OPERATOR: "Also suspends, reactivates and cancels schools, and sets storage",
  OWNER: "Also grants and revokes platform access",
};
const roleLabel = (r: PlatformRole) => r.charAt(0) + r.slice(1).toLowerCase();

function GrantModal({ onClose }: { onClose: () => void }) {
  const grant = useGrantPlatformAccess();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PlatformRole>("SUPPORT");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setError("Enter their email.");
    setError(null);
    try {
      await grant.mutateAsync({ email: email.trim(), role });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title="Grant Platform Access" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-xs text-slate-gray">
          They need an existing EduGear account that belongs to no school. Platform accounts are kept separate from school logins on purpose.
        </p>
        <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <SelectField label="Role *" value={role} onChange={(e) => setRole(e.target.value as PlatformRole)}>
          {PLATFORM_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}: {ROLE_HELP[r]}
            </option>
          ))}
        </SelectField>
        <FormError message={error} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={grant.isPending}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={grant.isPending}>
            Grant Access
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Owners only: who can use the platform console, and at what level. */
export function PlatformAdminsPanel({ me }: { me: PlatformOperator }) {
  const admins = usePlatformAdmins(true);
  const revoke = useRevokePlatformAccess();
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState<PlatformAdmin | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-gray">People at A4 who can sign in to this console.</p>
        <Button type="button" variant="tonal" className="w-auto px-3 py-2" onClick={() => setGranting(true)}>
          <Plus className="h-4 w-4" />
          Grant Access
        </Button>
      </div>
      <div className={cn(TABLE_CARD, "mt-4")}>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Last Sign-in</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.isPending ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-slate-gray">
                  <LoadingText label="Loading..." />
                </td>
              </tr>
            ) : admins.isError ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-slate-gray">
                  {errorMessage(admins.error)}
                  <RetryButton onRetry={() => admins.refetch()} />
                </td>
              </tr>
            ) : (
              admins.data.map((a) => (
                <tr key={a.id} className={TABLE_ROW}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary-navy">{a.fullName}</p>
                    <p className="text-xs text-slate-gray">{a.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Pill className="bg-cloud-sky text-bright-blue">{roleLabel(a.role)}</Pill>
                    {a.disabledAt && <Pill className="ml-1 bg-red-100 text-red-700">Disabled</Pill>}
                  </td>
                  <td className={cn("px-4 py-3", "text-xs text-slate-gray")}>{a.lastLoginAt ? formatRelativeTime(a.lastLoginAt) : "Never"}</td>
                  <td className={cn("px-4 py-3", "text-right")}>
                    {a.id !== me.id && !a.disabledAt && <IconAction icon={Trash2} label="Revoke access" tone="danger" onClick={() => setRevoking(a)} />}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {granting && <GrantModal onClose={() => setGranting(false)} />}
      {revoking && (
        <ConfirmDialog
          title="Revoke Platform Access"
          description={`${revoking.fullName} will no longer be able to sign in to the platform console.`}
          confirmLabel="Revoke"
          onClose={() => setRevoking(null)}
          onConfirm={() => revoke.mutateAsync(revoking.id)}
        />
      )}
    </div>
  );
}
