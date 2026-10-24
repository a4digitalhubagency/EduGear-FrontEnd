"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { errorMessage } from "@/lib/api-client";
import { usePortalAccess, usePortalAccessAction } from "@/lib/queries/portal";
import { useCan } from "@/lib/store/auth-store";
import { cn, formatDate } from "@/lib/utils";
import type { PortalAccess } from "@/types/portal";

const STATUS: Record<PortalAccess["status"], { label: string; style: string }> = {
  NONE: { label: "Not invited", style: "text-slate-gray" },
  INVITED: { label: "Invited", style: "text-amber-700" },
  ACTIVE: { label: "Active", style: "text-green-700" },
  SUSPENDED: { label: "Suspended", style: "text-red-600" },
  REVOKED: { label: "Revoked", style: "text-red-600" },
};

/**
 * One guardian's parent-portal login: status, plus Invite / Re-send / Revoke for staff with
 * guardians.update. Inviting emails them a link to /accept-invitation; the backend refuses
 * guardians with no email or no linked student, and its message is shown as-is.
 */
export function GuardianPortalAccess({ guardianId, guardianName, hasEmail }: { guardianId: string; guardianName: string; hasEmail: boolean }) {
  const canRead = useCan("guardians.read");
  const canManage = useCan("guardians.update");
  const access = usePortalAccess(guardianId, canRead);
  const action = usePortalAccessAction();
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [revoking, setRevoking] = useState(false);

  if (!canRead || access.isError) return null;
  if (access.isPending) return <p className="mt-3 text-xs text-slate-gray">Checking portal access...</p>;

  const a = access.data;
  if (a.usesStaffLogin) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-gray">
        <KeyRound className="h-3.5 w-3.5 shrink-0" />
        Parent portal: uses their staff login
      </p>
    );
  }

  const status = STATUS[a.status];
  const canInvite = a.status !== "ACTIVE";
  const canRevoke = a.status === "ACTIVE" || a.status === "INVITED";

  function invite() {
    setMessage(null);
    action.mutate(
      { guardianId, action: "invite" },
      {
        onSuccess: (r) =>
          setMessage({ text: r.status === "ACTIVE" ? "Portal opened on their existing login." : `Invitation sent to ${r.email}.`, error: false }),
        onError: (err) => setMessage({ text: errorMessage(err), error: true }),
      },
    );
  }

  return (
    <div className="mt-3 border-t border-slate-gray/10 pt-3 text-xs">
      <p className="flex flex-wrap items-center gap-1.5 text-slate-gray">
        <KeyRound className="h-3.5 w-3.5 shrink-0" />
        Parent portal: <span className={cn("font-semibold", status.style)}>{status.label}</span>
        {a.status === "INVITED" && a.invitedAt && <span>· {formatDate(a.invitedAt)}</span>}
        {a.status === "ACTIVE" && a.acceptedAt && <span>· since {formatDate(a.acceptedAt)}</span>}
      </p>
      {canManage && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          {canInvite && (
            <button
              type="button"
              onClick={invite}
              disabled={action.isPending || !hasEmail}
              title={hasEmail ? undefined : "Add an email address first"}
              className="font-semibold text-bright-blue hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
            >
              {a.status === "INVITED" ? "Re-send Invitation" : "Invite to Portal"}
            </button>
          )}
          {canRevoke && (
            <button type="button" onClick={() => setRevoking(true)} disabled={action.isPending} className="font-semibold text-red-600 hover:underline disabled:opacity-50">
              Revoke Access
            </button>
          )}
        </div>
      )}
      {!hasEmail && canInvite && canManage && <p className="mt-1 text-slate-gray">Add an email address to invite them.</p>}
      {message && <p className={cn("mt-1", message.error ? "text-red-600" : "text-green-700")}>{message.text}</p>}

      {revoking && (
        <ConfirmDialog
          title="Revoke Portal Access"
          description={`${guardianName} will be signed out and can no longer see their children in the parent portal. You can invite them again later.`}
          confirmLabel="Revoke"
          onClose={() => setRevoking(false)}
          onConfirm={async () => {
            setMessage(null);
            await action.mutateAsync({ guardianId, action: "revoke" });
            setMessage({ text: "Portal access revoked.", error: false });
          }}
        />
      )}
    </div>
  );
}
