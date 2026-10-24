"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormError } from "@/components/ui/FormError";
import { Select } from "@/components/ui/Select";
import { TermFormModal } from "@/components/academics/setup/TermFormModal";
import {
  CurrentBadge,
  IconAction,
  LoadingText,
  RetryButton,
  TABLE_CARD,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TERM_LABELS,
  TableStateRow,
} from "@/components/academics/setup/shared";
import { errorMessage } from "@/lib/api-client";
import { useDeleteTerm, useSessions, useSetCurrentTerm, useTerms } from "@/lib/queries/academics";
import { useCan } from "@/lib/store/auth-store";
import { formatDate } from "@/lib/utils";
import type { Term } from "@/types/academics";

const COLUMNS = 6;
const ALL_SESSIONS = "all";

export function TermsPanel() {
  const sessions = useSessions();
  const canCreate = useCan("academics.create");
  const canUpdate = useCan("academics.update");
  const canDelete = useCan("academics.delete");

  // null until the user picks one, so the filter can default to the current session once it loads.
  const [sessionFilter, setSessionFilter] = useState<string | null>(null);
  const sessionList = sessions.data?.data ?? [];
  const selected = sessionFilter ?? sessionList.find((s) => s.isCurrent)?.id ?? ALL_SESSIONS;
  const terms = useTerms(selected === ALL_SESSIONS ? undefined : selected);

  const setCurrent = useSetCurrentTerm();
  const deleteTerm = useDeleteTerm();
  const [editing, setEditing] = useState<Term | "new" | null>(null);
  const [deleting, setDeleting] = useState<Term | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function makeCurrent(term: Term) {
    setActionError(null);
    // The backend refuses unless the term's session is current, and says so.
    setCurrent.mutate(term.id, { onError: (err) => setActionError(errorMessage(err)) });
  }

  const rows = terms.data?.data ?? [];
  const noSessions = sessions.isSuccess && sessionList.length === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selected} onChange={(e) => setSessionFilter(e.target.value)} aria-label="Filter by session">
            <option value={ALL_SESSIONS}>All Sessions</option>
            {sessionList.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name} Session{session.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </Select>
          <p className="text-sm text-slate-gray">Each session has up to three terms.</p>
        </div>
        {canCreate && (
          <Button
            type="button"
            className="w-auto px-4 py-2.5"
            onClick={() => setEditing("new")}
            disabled={noSessions}
            title={noSessions ? "Create a session first" : undefined}
          >
            <Plus className="h-4 w-4" />
            New Term
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
              <th className="px-4 py-3">Term</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {terms.isPending || sessions.isPending ? (
              <TableStateRow colSpan={COLUMNS}>
                <LoadingText label="Loading terms..." />
              </TableStateRow>
            ) : terms.isError ? (
              <TableStateRow colSpan={COLUMNS}>
                {errorMessage(terms.error)}
                <RetryButton onRetry={() => terms.refetch()} />
              </TableStateRow>
            ) : noSessions ? (
              <TableStateRow colSpan={COLUMNS}>Create a session first, then add its terms here.</TableStateRow>
            ) : rows.length === 0 ? (
              <TableStateRow colSpan={COLUMNS}>No terms in this session yet.</TableStateRow>
            ) : (
              rows.map((term) => (
                <tr key={term.id} className={TABLE_ROW}>
                  <td className="px-4 py-3 font-semibold text-primary-navy">{TERM_LABELS[term.name]}</td>
                  <td className="px-4 py-3 text-slate-gray">{term.sessionName}</td>
                  <td className="px-4 py-3 text-slate-gray">{formatDate(term.startDate)}</td>
                  <td className="px-4 py-3 text-slate-gray">{formatDate(term.endDate)}</td>
                  <td className="px-4 py-3">
                    {term.isCurrent ? (
                      <CurrentBadge />
                    ) : canUpdate ? (
                      <button
                        type="button"
                        onClick={() => makeCurrent(term)}
                        disabled={setCurrent.isPending}
                        className="text-sm font-semibold text-bright-blue hover:underline disabled:opacity-60"
                      >
                        {setCurrent.isPending && setCurrent.variables === term.id ? "Updating..." : "Make current"}
                      </button>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {canUpdate && (
                        <IconAction icon={Pencil} label={`Edit ${TERM_LABELS[term.name]}`} onClick={() => setEditing(term)} />
                      )}
                      {canDelete && (
                        <IconAction
                          icon={Trash2}
                          label={`Delete ${TERM_LABELS[term.name]}`}
                          tone="danger"
                          onClick={() => setDeleting(term)}
                          disabledReason={
                            term.isCurrent ? "The current term can't be deleted. Make another term current first." : null
                          }
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
        <TermFormModal
          term={editing === "new" ? undefined : editing}
          sessions={sessionList}
          defaultSessionId={selected === ALL_SESSIONS ? undefined : selected}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Term?"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-primary-navy">
                {TERM_LABELS[deleting.name]} ({deleting.sessionName})
              </span>
              ? This action cannot be undone.
            </>
          }
          onConfirm={() => deleteTerm.mutateAsync(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
