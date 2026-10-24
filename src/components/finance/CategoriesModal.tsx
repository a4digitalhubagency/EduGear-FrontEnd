"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { IconAction, LoadingText, Pill } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { useCreateFeeCategory, useDeleteFeeCategory, useFeeCategories, useUpdateFeeCategory } from "@/lib/queries/finance";
import { useCan } from "@/lib/store/auth-store";

/**
 * Fee categories (Tuition, Books, PTA levy): the building blocks of fee structures.
 * A category already used by a structure can't be deleted, only retired, so its
 * history stays intact.
 */
export function CategoriesModal({ onClose }: { onClose: () => void }) {
  const canCreate = useCan("finance.create");
  const canUpdate = useCan("finance.update");
  const categories = useFeeCategories();
  const create = useCreateFeeCategory();
  const update = useUpdateFeeCategory();
  const remove = useDeleteFeeCategory();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await create.mutateAsync({ name: name.trim() });
      setName("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function run(action: Promise<unknown>) {
    setError(null);
    action.catch((err) => setError(errorMessage(err)));
  }

  const list = categories.data?.data ?? [];

  return (
    <Modal title="Fee Categories" onClose={onClose}>
      <p className="text-sm text-slate-gray">The kinds of charges your fee structures are made of.</p>

      {canCreate && (
        <form onSubmit={add} className="mt-4 flex gap-2">
          <div className="flex-1">
            <Input placeholder="e.g. Tuition" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} aria-label="New category name" />
          </div>
          <Button type="submit" className="w-auto px-4" isLoading={create.isPending}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      )}

      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}

      <ul className="mt-4 max-h-80 divide-y divide-slate-gray/10 overflow-y-auto rounded-lg border border-slate-gray/10">
        {categories.isPending ? (
          <li className="px-3 py-4 text-sm text-slate-gray">
            <LoadingText label="Loading..." />
          </li>
        ) : list.length === 0 ? (
          <li className="px-3 py-4 text-sm text-slate-gray">No categories yet.</li>
        ) : (
          list.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary-navy">
                  {c.name}
                  {!c.isActive && <Pill className="bg-slate-gray/10 text-slate-gray">Retired</Pill>}
                </p>
                <p className="text-xs text-slate-gray">
                  Used by {c.usageCount} structure{c.usageCount === 1 ? "" : "s"}
                </p>
              </div>
              {canUpdate && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => run(update.mutateAsync({ id: c.id, input: { isActive: !c.isActive } }))}
                    className="text-xs font-semibold text-bright-blue hover:underline"
                  >
                    {c.isActive ? "Retire" : "Restore"}
                  </button>
                  <IconAction
                    icon={Trash2}
                    label={`Delete ${c.name}`}
                    tone="danger"
                    onClick={() => run(remove.mutateAsync(c.id))}
                    disabledReason={c.usageCount > 0 ? "In use by a fee structure. Retire it instead." : null}
                  />
                </div>
              )}
            </li>
          ))
        )}
      </ul>

      <Button type="button" variant="secondary" className="mt-5" onClick={onClose}>
        Done
      </Button>
    </Modal>
  );
}
