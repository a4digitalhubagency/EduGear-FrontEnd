"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select, SelectField } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { TERM_LABELS } from "@/components/academics/setup/shared";
import { errorMessage } from "@/lib/api-client";
import { useClasses, useTerms } from "@/lib/queries/academics";
import { useCreateFeeStructure, useFeeCategories, useUpdateFeeStructure } from "@/lib/queries/finance";
import { formatNaira, toDateInput } from "@/lib/utils";
import { MAX_FEE_AMOUNT, MAX_STRUCTURE_ITEMS, type FeeStructure } from "@/types/finance";

type ItemValues = { categoryId: string; amount: string; isOptional: boolean };
type FormValues = {
  name: string;
  termId: string; // "" = whole session
  classId: string; // "" = every class
  dueDate: string;
  description: string;
  items: ItemValues[];
};

interface StructureFormModalProps {
  sessionId: string;
  sessionName: string;
  /** Omitted when creating. */
  structure?: FeeStructure;
  onClose: () => void;
}

/**
 * Create or edit a fee structure: what a class pays for a term (or the whole session),
 * as a list of category lines. Session, term and class are fixed once created; the
 * lines can't change once invoices have been issued from it (the backend refuses).
 */
export function StructureFormModal({ sessionId, sessionName, structure, onClose }: StructureFormModalProps) {
  const isEdit = !!structure;
  const itemsLocked = !!structure && structure.invoiceCount > 0;
  const terms = useTerms(sessionId);
  const classes = useClasses();
  const categories = useFeeCategories();
  const create = useCreateFeeStructure();
  const update = useUpdateFeeStructure();
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, watch, formState } = useForm<FormValues>({
    defaultValues: {
      name: structure?.name ?? "",
      termId: structure?.termId ?? "",
      classId: structure?.classId ?? "",
      dueDate: structure?.dueDate ? toDateInput(structure.dueDate) : "",
      description: structure?.description ?? "",
      items: structure?.items.map((i) => ({ categoryId: i.categoryId, amount: String(i.amount), isOptional: i.isOptional })) ?? [
        { categoryId: "", amount: "", isOptional: false },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  // eslint-disable-next-line react-hooks/incompatible-library -- watch() drives the live total below
  const items = watch("items");
  const compulsoryTotal = items.reduce((sum, i) => sum + (i.isOptional ? 0 : Number(i.amount) || 0), 0);

  const activeCategories = (categories.data?.data ?? []).filter(
    (c) => c.isActive || structure?.items.some((i) => i.categoryId === c.id), // keep a retired one already in use
  );

  async function onSubmit(values: FormValues) {
    setError(null);
    if (!values.name.trim()) return setError("Give the structure a name, e.g. JSS1 First Term Fees.");
    const lines = values.items.map((i) => ({ categoryId: i.categoryId, amount: Number(i.amount), isOptional: i.isOptional }));
    if (!itemsLocked) {
      if (lines.length === 0) return setError("Add at least one fee item.");
      if (lines.some((l) => !l.categoryId)) return setError("Choose a category for every item.");
      if (lines.some((l) => !(l.amount >= 0) || l.amount > MAX_FEE_AMOUNT)) return setError("Every item needs a valid amount.");
      if (new Set(lines.map((l) => l.categoryId)).size !== lines.length) return setError("Each category can appear only once.");
    }
    try {
      if (structure) {
        await update.mutateAsync({
          id: structure.id,
          input: {
            name: values.name.trim(),
            description: values.description.trim() || null,
            dueDate: values.dueDate || null,
            ...(itemsLocked ? {} : { items: lines }),
          },
        });
      } else {
        await create.mutateAsync({
          name: values.name.trim(),
          sessionId,
          termId: values.termId || null,
          classId: values.classId || null,
          description: values.description.trim() || null,
          dueDate: values.dueDate || null,
          items: lines,
        });
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title={isEdit ? "Edit Fee Structure" : "New Fee Structure"} onClose={onClose} className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Name *" placeholder="e.g. JSS1 First Term Fees" maxLength={120} {...register("name")} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-primary-navy">Session</p>
            <p className="rounded-lg bg-cloud-sky/30 px-3 py-3 text-sm text-primary-navy">{sessionName}</p>
          </div>
          <SelectField label="Term" disabled={isEdit} {...register("termId")}>
            <option value="">Whole session</option>
            {(terms.data?.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {TERM_LABELS[t.name]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Class" disabled={isEdit} {...register("classId")}>
            <option value="">All classes</option>
            {(classes.data?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Due Date" type="date" {...register("dueDate")} />
          <Textarea label="Description" rows={1} maxLength={255} {...register("description")} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold text-primary-navy">Fee Items *</p>
            <p className="text-sm font-semibold text-primary-navy">Total: {formatNaira(compulsoryTotal)}</p>
          </div>
          {itemsLocked && (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-primary-navy">
              Invoices have been issued from this structure, so its amounts can&apos;t change. Archive it and create a new
              one instead.
            </p>
          )}
          {!categories.isPending && activeCategories.length === 0 && (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-primary-navy">
              Add fee categories first (e.g. Tuition, Books) with the &quot;Fee Categories&quot; button.
            </p>
          )}
          <fieldset disabled={itemsLocked} className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-gray/10 p-2">
                <Select className="min-w-44" aria-label="Category" {...register(`items.${index}.categoryId`)}>
                  <option value="">Category...</option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <input
                  type="number"
                  min={0}
                  placeholder="Amount (₦)"
                  aria-label="Amount"
                  className="w-36 rounded-lg border border-slate-gray/25 px-3 py-2.5 text-sm text-primary-navy focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20"
                  {...register(`items.${index}.amount`)}
                />
                <Checkbox id={`items-${index}-optional`} label="Optional" {...register(`items.${index}.isOptional`)} />
                {!itemsLocked && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove item"
                    className="ml-auto rounded-md p-1.5 text-slate-gray hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </fieldset>
          {!itemsLocked && fields.length < MAX_STRUCTURE_ITEMS && (
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-auto px-3 py-2"
              onClick={() => append({ categoryId: "", amount: "", isOptional: false })}
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          )}
          <p className="mt-1 text-xs text-slate-gray">
            Optional items (e.g. a bus place) are only billed when ticked while issuing invoices. The total counts
            compulsory items.
          </p>
        </div>

        <FormError message={error} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={formState.isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={formState.isSubmitting}>
            {isEdit ? "Save Changes" : "Create as Draft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
