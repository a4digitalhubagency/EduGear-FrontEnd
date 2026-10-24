"use client";

import { useState } from "react";
import { Archive, Pencil, Plus, Send, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormError } from "@/components/ui/FormError";
import { Select } from "@/components/ui/Select";
import {
  IconAction,
  LoadingText,
  Pill,
  RetryButton,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TableStateRow,
} from "@/components/ui/table";
import { CategoriesModal } from "@/components/finance/CategoriesModal";
import { StructureFormModal } from "@/components/finance/StructureFormModal";
import { errorMessage } from "@/lib/api-client";
import { STRUCTURE_STATUS_LABELS, STRUCTURE_STATUS_STYLES } from "@/lib/finance-labels";
import { useDeleteFeeStructure, useFeeStructureAction, useFeeStructures } from "@/lib/queries/finance";
import { useCan } from "@/lib/store/auth-store";
import { formatDate, formatNaira } from "@/lib/utils";
import { FEE_STRUCTURE_STATUSES, type FeeStructure, type FeeStructureStatus } from "@/types/finance";

const COLUMNS = 7;

interface StructuresPanelProps {
  sessionId: string | undefined;
  sessionName: string | undefined;
}

/** Fee Structures tab: draft → publish (then invoices can be issued) → archive. */
export function StructuresPanel({ sessionId, sessionName }: StructuresPanelProps) {
  const canCreate = useCan("finance.create");
  const canUpdate = useCan("finance.update");
  const [status, setStatus] = useState<FeeStructureStatus | "">("");
  const structures = useFeeStructures({ sessionId, status: status || undefined }, !!sessionId);
  const action = useFeeStructureAction();
  const remove = useDeleteFeeStructure();

  const [editing, setEditing] = useState<FeeStructure | "new" | null>(null);
  const [deleting, setDeleting] = useState<FeeStructure | null>(null);
  const [archiving, setArchiving] = useState<FeeStructure | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function publish(structure: FeeStructure) {
    setActionError(null);
    action.mutate({ id: structure.id, action: "publish" }, { onError: (err) => setActionError(errorMessage(err)) });
  }

  if (!sessionId) {
    return (
      <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
        Choose a session above. Fee structures belong to a session.
      </div>
    );
  }

  const rows = structures.data?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value as FeeStructureStatus | "")} aria-label="Filter by status">
            <option value="">All Status</option>
            {FEE_STRUCTURE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STRUCTURE_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <p className="text-sm text-slate-gray">Publish a structure to issue invoices from it.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="w-auto px-4 py-2.5" onClick={() => setCategoriesOpen(true)}>
            <Tags className="h-4 w-4" />
            Fee Categories
          </Button>
          {canCreate && (
            <Button type="button" className="w-auto px-4 py-2.5" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" />
              New Fee Structure
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mt-4">
          <FormError message={actionError} />
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Structure</th>
              <th className="px-4 py-3">Applies To</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Invoices</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {structures.isPending ? (
              <TableStateRow colSpan={COLUMNS}>
                <LoadingText label="Loading fee structures..." />
              </TableStateRow>
            ) : structures.isError ? (
              <TableStateRow colSpan={COLUMNS}>
                {errorMessage(structures.error)}
                <RetryButton onRetry={() => structures.refetch()} />
              </TableStateRow>
            ) : rows.length === 0 ? (
              <TableStateRow colSpan={COLUMNS}>
                No fee structures yet.{canCreate && " Start with Fee Categories, then create a structure."}
              </TableStateRow>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className={TABLE_ROW}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary-navy">{s.name}</p>
                    <p className="text-xs text-slate-gray">
                      {s.items.length} item{s.items.length === 1 ? "" : "s"}
                      {s.description ? ` · ${s.description}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-gray">
                    {s.className ?? "All classes"}
                    <p className="text-xs">{s.termName ?? "Whole session"}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary-navy">{formatNaira(s.totalAmount)}</td>
                  <td className="px-4 py-3 text-slate-gray">{s.dueDate ? formatDate(s.dueDate) : "—"}</td>
                  <td className="px-4 py-3 text-slate-gray">{s.invoiceCount}</td>
                  <td className="px-4 py-3">
                    <Pill className={STRUCTURE_STATUS_STYLES[s.status]}>{STRUCTURE_STATUS_LABELS[s.status]}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {canUpdate && s.status === "DRAFT" && (
                        <IconAction
                          icon={Send}
                          label="Publish so invoices can be issued"
                          onClick={() => publish(s)}
                          disabledReason={s.items.length === 0 ? "Add at least one item first." : null}
                        />
                      )}
                      {canUpdate && s.status !== "ARCHIVED" && (
                        <IconAction icon={Pencil} label={`Edit ${s.name}`} onClick={() => setEditing(s)} />
                      )}
                      {canUpdate && s.status !== "ARCHIVED" && (
                        <IconAction icon={Archive} label="Archive (stop issuing it)" onClick={() => setArchiving(s)} />
                      )}
                      {canUpdate && (
                        <IconAction
                          icon={Trash2}
                          label={`Delete ${s.name}`}
                          tone="danger"
                          onClick={() => setDeleting(s)}
                          disabledReason={s.invoiceCount > 0 ? "Invoices were issued from it. Archive it instead." : null}
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

      {editing && sessionName && (
        <StructureFormModal
          sessionId={sessionId}
          sessionName={sessionName}
          structure={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {categoriesOpen && <CategoriesModal onClose={() => setCategoriesOpen(false)} />}
      {archiving && (
        <ConfirmDialog
          title="Archive Fee Structure?"
          description={
            <>
              <span className="font-semibold text-primary-navy">{archiving.name}</span> will stop being available for new
              invoices. Invoices already issued are unaffected. This can&apos;t be undone.
            </>
          }
          confirmLabel="Archive"
          onConfirm={() => action.mutateAsync({ id: archiving.id, action: "archive" })}
          onClose={() => setArchiving(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete Fee Structure?"
          description={
            <>
              Are you sure you want to delete <span className="font-semibold text-primary-navy">{deleting.name}</span>?
              This action cannot be undone.
            </>
          }
          onConfirm={() => remove.mutateAsync(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
