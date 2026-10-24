"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormError } from "@/components/ui/FormError";
import { SessionFormModal } from "@/components/academics/setup/SessionFormModal";
import {
  CurrentBadge,
  IconAction,
  LoadingText,
  RetryButton,
  TABLE_CARD,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TableStateRow,
} from "@/components/academics/setup/shared";
import { errorMessage } from "@/lib/api-client";
import { useDeleteSession, useSessions, useSetCurrentSession } from "@/lib/queries/academics";
import { useCan } from "@/lib/store/auth-store";
import { formatDate } from "@/lib/utils";
import type { AcademicSession } from "@/types/academics";

const COLUMNS = 6;

/** Rules the backend enforces on delete that the list data already reveals. */
function sessionDeleteBlocker(session: AcademicSession) {
  if (session.isCurrent) return "The current session can't be deleted. Make another session current first.";
  if (session.termCount > 0) return "Delete this session's terms first.";
  return null;
}

export function SessionsPanel() {
  const sessions = useSessions();
  const setCurrent = useSetCurrentSession();
  const deleteSession = useDeleteSession();
  const canCreate = useCan("academics.create");
  const canUpdate = useCan("academics.update");
  const canDelete = useCan("academics.delete");

  const [editing, setEditing] = useState<AcademicSession | "new" | null>(null);
  const [deleting, setDeleting] = useState<AcademicSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function makeCurrent(session: AcademicSession) {
    setActionError(null);
    setCurrent.mutate(session.id, { onError: (err) => setActionError(errorMessage(err)) });
  }

  const rows = sessions.data?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-gray">
          A session is the school year, e.g. 2025/2026. Exactly one is current at a time.
        </p>
        {canCreate && (
          <Button type="button" className="w-auto px-4 py-2.5" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        )}
      </div>

      {actionError && (
        <div className="mt-4">
          <FormError message={actionError} />
        </div>
      )}

      <div className={`mt-4 ${TABLE_CARD}`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Terms</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.isPending ? (
              <TableStateRow colSpan={COLUMNS}>
                <LoadingText label="Loading sessions..." />
              </TableStateRow>
            ) : sessions.isError ? (
              <TableStateRow colSpan={COLUMNS}>
                {errorMessage(sessions.error)}
                <RetryButton onRetry={() => sessions.refetch()} />
              </TableStateRow>
            ) : rows.length === 0 ? (
              <TableStateRow colSpan={COLUMNS}>
                No sessions yet.{canCreate && " Create your first session to get started."}
              </TableStateRow>
            ) : (
              rows.map((session) => (
                <tr key={session.id} className={TABLE_ROW}>
                  <td className="px-4 py-3 font-semibold text-primary-navy">{session.name}</td>
                  <td className="px-4 py-3 text-slate-gray">{formatDate(session.startDate)}</td>
                  <td className="px-4 py-3 text-slate-gray">{formatDate(session.endDate)}</td>
                  <td className="px-4 py-3 text-slate-gray">{session.termCount}</td>
                  <td className="px-4 py-3">
                    {session.isCurrent ? (
                      <CurrentBadge />
                    ) : canUpdate ? (
                      <button
                        type="button"
                        onClick={() => makeCurrent(session)}
                        disabled={setCurrent.isPending}
                        className="text-sm font-semibold text-bright-blue hover:underline disabled:opacity-60"
                      >
                        {setCurrent.isPending && setCurrent.variables === session.id ? "Updating..." : "Make current"}
                      </button>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {canUpdate && <IconAction icon={Pencil} label={`Edit ${session.name}`} onClick={() => setEditing(session)} />}
                      {canDelete && (
                        <IconAction
                          icon={Trash2}
                          label={`Delete ${session.name}`}
                          tone="danger"
                          onClick={() => setDeleting(session)}
                          disabledReason={sessionDeleteBlocker(session)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <SessionFormModal session={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Session?"
          description={
            <>
              Are you sure you want to delete the{" "}
              <span className="font-semibold text-primary-navy">{deleting.name}</span> session? This action cannot be
              undone.
            </>
          }
          onConfirm={() => deleteSession.mutateAsync(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
