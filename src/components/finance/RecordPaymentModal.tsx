"use client";

import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingText } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance-labels";
import { useDebouncedValue } from "@/lib/hooks";
import { useInvoices, useRecordPayment } from "@/lib/queries/finance";
import { useStudents } from "@/lib/queries/students";
import { cn, formatDate, formatNaira, todayInput as today } from "@/lib/utils";
import { PAYMENT_METHODS, type Invoice, type PaymentMethod } from "@/types/finance";
import type { Student } from "@/types/students";

/**
 * "Record Payment" (IA flow 4): find the student, pick the invoice being paid, enter
 * the money. The payment is saved as PENDING and only reduces the balance once
 * verified. Online payments aren't offered here: those start from the parent portal.
 */
export function RecordPaymentModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [student, setStudent] = useState<Student | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const students = useStudents({ search: debounced.trim() || undefined, status: "ALL", limit: 8, sortBy: "lastName", sortOrder: "asc" });
  const invoices = useInvoices({ studentId: student?.id, owing: true, limit: 50 }, !!student);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const record = useRecordPayment();

  function pickInvoice(next: Invoice) {
    setInvoice(next);
    setAmount(String(next.balance)); // most payments clear the balance; easy to lower
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    const value = Number(amount);
    if (!(value > 0)) return setError("Enter the amount paid.");
    if (value > invoice.balance) return setError(`That's more than the ${formatNaira(invoice.balance)} still owed on this invoice.`);
    if (!paidAt) return setError("Enter the date the money was paid.");
    setError(null);
    try {
      await record.mutateAsync({
        studentFeeId: invoice.id,
        amount: value,
        method,
        reference: reference.trim() || null,
        paidAt,
        note: note.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const studentList = students.data?.data ?? [];
  const owing = invoices.data?.data ?? [];

  return (
    <Modal title="Record Payment" onClose={onClose} className="max-w-lg">
      {!student ? (
        <div className="space-y-3">
          <Input
            icon={Search}
            label="Student"
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="max-h-72 divide-y divide-slate-gray/10 overflow-y-auto rounded-lg border border-slate-gray/10">
            {students.isPending ? (
              <li className="px-3 py-4 text-sm text-slate-gray">
                <LoadingText label="Searching..." />
              </li>
            ) : studentList.length === 0 ? (
              <li className="px-3 py-4 text-sm text-slate-gray">No students found.</li>
            ) : (
              studentList.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setStudent(s)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-cloud-sky/30"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-primary-navy">{s.fullName}</span>
                      <span className="text-xs text-slate-gray">
                        {s.studentId}
                        {s.className ? ` · ${s.className}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-cloud-sky/30 px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-primary-navy">{student.fullName}</p>
              <p className="text-xs text-slate-gray">
                {student.studentId}
                {student.className ? ` · ${student.className}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStudent(null);
                setInvoice(null);
              }}
              className="text-xs font-semibold text-bright-blue hover:underline"
            >
              Change
            </button>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-primary-navy">Invoice being paid *</p>
            {invoices.isPending ? (
              <p className="text-sm text-slate-gray">
                <LoadingText label="Loading invoices..." />
              </p>
            ) : owing.length === 0 ? (
              <p className="rounded-lg border border-slate-gray/10 px-3 py-3 text-sm text-slate-gray">
                This student has no unpaid invoices.
              </p>
            ) : (
              <ul className="space-y-2">
                {owing.map((inv) => (
                  <li key={inv.id}>
                    <button
                      type="button"
                      onClick={() => pickInvoice(inv)}
                      aria-pressed={invoice?.id === inv.id}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left",
                        invoice?.id === inv.id
                          ? "border-bright-blue bg-cloud-sky/40"
                          : "border-slate-gray/15 hover:border-bright-blue/40",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-primary-navy">{inv.structureName}</span>
                        <span className="text-xs text-slate-gray">
                          Owes {formatNaira(inv.balance)} of {formatNaira(inv.payableAmount)}
                          {inv.dueDate ? ` · due ${formatDate(inv.dueDate)}` : ""}
                        </span>
                      </span>
                      {invoice?.id === inv.id && <Check className="h-4 w-4 text-bright-blue" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {invoice && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Amount (₦) *"
                  type="number"
                  min={1}
                  max={invoice.balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <SelectField label="Method *" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                  {PAYMENT_METHODS.filter((m) => m !== "ONLINE").map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Reference"
                  placeholder="Teller / transfer ref / POS stub"
                  maxLength={120}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
                <Input label="Date Paid *" type="date" max={today()} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
              </div>
              <Textarea label="Note" rows={2} maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
              <p className="text-xs text-slate-gray">
                Saved as <span className="font-semibold">pending</span>. It reduces the balance and gets a receipt
                number once someone verifies it.
              </p>
            </>
          )}

          <FormError message={error} />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={record.isPending}>
              Cancel
            </Button>
            <Button type="submit" className="w-auto flex-1" isLoading={record.isPending} disabled={!invoice}>
              Record Payment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
