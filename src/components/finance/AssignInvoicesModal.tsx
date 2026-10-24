"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import { errorMessage } from "@/lib/api-client";
import { useClassArms } from "@/lib/queries/academics";
import { useAssignInvoices, useFeeStructures } from "@/lib/queries/finance";
import { formatNaira, todayInput } from "@/lib/utils";
import type { AssignInvoicesResult } from "@/types/finance";

/**
 * "Issue Invoices": bill every ACTIVE student in one arm from a PUBLISHED fee structure.
 * Students who already have that invoice are skipped by the backend, so re-running it
 * for an arm only bills newcomers.
 */
export function AssignInvoicesModal({ sessionId, onClose }: { sessionId: string | undefined; onClose: () => void }) {
  const structures = useFeeStructures({ sessionId, status: "PUBLISHED" });
  const arms = useClassArms();
  const assign = useAssignInvoices();

  const [structureId, setStructureId] = useState("");
  const [classArmId, setClassArmId] = useState("");
  const [optionalIds, setOptionalIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssignInvoicesResult | null>(null);

  const structure = structures.data?.data.find((s) => s.id === structureId);
  // A structure for one class can only bill that class's arms.
  const armOptions = (arms.data?.data ?? []).filter((arm) => !structure?.classId || arm.classId === structure.classId);
  const optionalItems = structure?.items.filter((item) => item.isOptional) ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!structureId) return setError("Choose a fee structure.");
    if (!classArmId) return setError("Choose the class arm to bill.");
    setError(null);
    try {
      setResult(
        await assign.mutateAsync({
          structureId,
          classArmId,
          ...(optionalIds.length ? { includeOptionalItemIds: optionalIds } : {}),
          ...(dueDate ? { dueDate } : {}),
        }),
      );
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (result) {
    return (
      <Modal title="Invoices Issued" onClose={onClose}>
        <div className="flex gap-3 rounded-lg bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <div className="text-sm text-primary-navy">
            <p className="font-semibold">
              {result.assigned} invoice{result.assigned === 1 ? "" : "s"} issued, totalling {formatNaira(result.totalBilled)}.
            </p>
            {result.skipped > 0 && (
              <p className="mt-1 text-slate-gray">
                {result.skipped} student{result.skipped === 1 ? " already had" : "s already had"} this invoice and{" "}
                {result.skipped === 1 ? "was" : "were"} skipped.
              </p>
            )}
          </div>
        </div>
        <Button type="button" className="mt-5" onClick={onClose}>
          Done
        </Button>
      </Modal>
    );
  }

  const noStructures = structures.isSuccess && structures.data.data.length === 0;

  return (
    <Modal title="Issue Invoices" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {noStructures ? (
          <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-primary-navy">
            There&apos;s no published fee structure for this session. Create one under Fee Structures and publish it
            first.
          </p>
        ) : (
          <>
            <SelectField
              label="Fee Structure *"
              value={structureId}
              onChange={(e) => {
                setStructureId(e.target.value);
                setClassArmId("");
                setOptionalIds([]);
              }}
            >
              <option value="" disabled>
                {structures.isPending ? "Loading..." : "Select a published structure"}
              </option>
              {(structures.data?.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatNaira(s.totalAmount)}
                  {s.className ? ` · ${s.className}` : ""}
                </option>
              ))}
            </SelectField>

            <SelectField label="Class Arm *" value={classArmId} onChange={(e) => setClassArmId(e.target.value)} disabled={!structure}>
              <option value="" disabled>
                Select arm
              </option>
              {armOptions.map((arm) => (
                <option key={arm.id} value={arm.id}>
                  {arm.fullName} ({arm.studentCount} active)
                </option>
              ))}
            </SelectField>

            {optionalItems.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold text-primary-navy">Optional items to include</p>
                <div className="space-y-2">
                  {optionalItems.map((item) => (
                    <Checkbox
                      key={item.id}
                      label={`${item.categoryName} (${formatNaira(item.amount)})`}
                      checked={optionalIds.includes(item.id)}
                      onChange={(e) =>
                        setOptionalIds((ids) => (e.target.checked ? [...ids, item.id] : ids.filter((id) => id !== item.id)))
                      }
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-gray">Ticked items are billed to every student in the arm.</p>
              </div>
            )}

            <div>
              <Input label="Due Date" type="date" min={todayInput()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <p className="mt-1.5 text-xs text-slate-gray">
                Leave empty to use the structure&apos;s own due date
                {structure?.dueDate ? "" : " (or the school's default days to pay)"}.
              </p>
            </div>
          </>
        )}

        <FormError message={error} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={assign.isPending}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={assign.isPending} disabled={noStructures}>
            Issue Invoices
          </Button>
        </div>
      </form>
    </Modal>
  );
}
