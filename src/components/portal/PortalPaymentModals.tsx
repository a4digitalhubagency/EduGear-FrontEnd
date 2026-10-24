"use client";

import { useRef, useState } from "react";
import { CreditCard, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import { errorMessage } from "@/lib/api-client";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance-labels";
import { useStartOnlinePayment, useSubmitPortalPayment } from "@/lib/queries/portal";
import { formatNaira, todayInput } from "@/lib/utils";
import type { StudentStatement } from "@/types/finance";
import { PORTAL_PAYMENT_METHODS } from "@/types/portal";

type OpenInvoice = StudentStatement["invoices"][number];

const EVIDENCE_TYPES = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

function InvoiceSelect({ invoices, value, onChange }: { invoices: OpenInvoice[]; value: string; onChange: (id: string) => void }) {
  return (
    <SelectField label="Paying for *" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>
        Select the fee
      </option>
      {invoices.map((inv) => (
        <option key={inv.id} value={inv.id}>
          {inv.structureName} · owes {formatNaira(inv.balance)}
        </option>
      ))}
    </SelectField>
  );
}

/**
 * "I've paid": a bank transfer, POS or cheque made outside EduGear. Optionally attach the
 * teller or a screenshot. It arrives as pending and only reduces the balance once the
 * school's bursar has checked and verified it.
 */
export function SubmitProofModal({ studentId, invoices, onClose }: { studentId: string; invoices: OpenInvoice[]; onClose: () => void }) {
  const submit = useSubmitPortalPayment();
  const fileInput = useRef<HTMLInputElement>(null);
  const [invoiceId, setInvoiceId] = useState(invoices.length === 1 ? invoices[0].id : "");
  const invoice = invoices.find((i) => i.id === invoiceId);
  const [amount, setAmount] = useState(invoices.length === 1 ? String(invoices[0].balance) : "");
  const [method, setMethod] = useState<(typeof PORTAL_PAYMENT_METHODS)[number]>("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(todayInput());
  const [evidence, setEvidence] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!invoice) return setError("Choose the fee you paid for.");
    if (!(value > 0)) return setError("Enter the amount you paid.");
    if (value > invoice.balance) return setError(`That's more than the ${formatNaira(invoice.balance)} owed on this fee.`);
    if (!reference.trim()) return setError("Enter the bank, teller or transfer reference so the school can find your payment.");
    setError(null);
    try {
      await submit.mutateAsync({ studentId, input: { studentFeeId: invoice.id, amount: value, method, reference: reference.trim(), paidAt }, evidence });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (done) {
    return (
      <Modal title="Payment Sent" onClose={onClose}>
        <p className="text-sm text-slate-gray">
          Thank you. The school will check your payment and confirm it. Your balance updates once it&apos;s verified, and
          you&apos;ll get a notification and a receipt.
        </p>
        <Button type="button" className="mt-5" onClick={onClose}>
          Done
        </Button>
      </Modal>
    );
  }

  return (
    <Modal title="Tell the School You've Paid" onClose={onClose}>
      <form onSubmit={send} noValidate className="space-y-4">
        <InvoiceSelect
          invoices={invoices}
          value={invoiceId}
          onChange={(id) => {
            setInvoiceId(id);
            setAmount(String(invoices.find((i) => i.id === id)?.balance ?? ""));
          }}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Amount Paid (₦) *" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <SelectField label="How You Paid *" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            {PORTAL_PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Reference *" placeholder="Teller / transfer reference" maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} />
          <Input label="Date Paid *" type="date" max={todayInput()} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-primary-navy">Proof of payment</p>
          <input
            ref={fileInput}
            type="file"
            accept={EVIDENCE_TYPES}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file && file.size > MAX_EVIDENCE_BYTES) setError("That file is over 10 MB. Try a smaller photo.");
              else setEvidence(file);
              e.target.value = "";
            }}
          />
          {evidence ? (
            <p className="flex items-center justify-between gap-2 rounded-lg border border-slate-gray/15 px-3 py-2 text-sm text-primary-navy">
              <span className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-gray" />
                <span className="truncate">{evidence.name}</span>
              </span>
              <button type="button" onClick={() => setEvidence(null)} aria-label="Remove file" className="text-slate-gray hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </p>
          ) : (
            <Button type="button" variant="secondary" className="w-auto px-3 py-2" onClick={() => fileInput.current?.click()}>
              <Paperclip className="h-4 w-4" />
              Attach teller or screenshot
            </Button>
          )}
          <p className="mt-1.5 text-xs text-slate-gray">Optional, but it helps the school confirm faster. Photo or PDF, up to 10 MB.</p>
        </div>
        <FormError message={error} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={submit.isPending}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={submit.isPending}>
            Send to School
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Pay by card: the backend creates a pending payment and returns the provider's checkout page. */
export function PayOnlineModal({ studentId, invoices, onClose }: { studentId: string; invoices: OpenInvoice[]; onClose: () => void }) {
  const start = useStartOnlinePayment();
  const [invoiceId, setInvoiceId] = useState(invoices.length === 1 ? invoices[0].id : "");
  const invoice = invoices.find((i) => i.id === invoiceId);
  const [amount, setAmount] = useState(invoices.length === 1 ? String(invoices[0].balance) : "");
  const [error, setError] = useState<string | null>(null);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!invoice) return setError("Choose the fee you're paying.");
    if (!(value >= 100)) return setError("The smallest online payment is ₦100.");
    if (value > invoice.balance) return setError(`That's more than the ${formatNaira(invoice.balance)} owed.`);
    setError(null);
    try {
      const started = await start.mutateAsync({ studentId, studentFeeId: invoice.id, amount: value });
      window.location.assign(started.authorizationUrl); // the provider's secure checkout
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title="Pay Online" onClose={onClose}>
      <form onSubmit={pay} noValidate className="space-y-4">
        <InvoiceSelect
          invoices={invoices}
          value={invoiceId}
          onChange={(id) => {
            setInvoiceId(id);
            setAmount(String(invoices.find((i) => i.id === id)?.balance ?? ""));
          }}
        />
        <Input label="Amount (₦) *" type="number" min={100} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <p className="text-xs text-slate-gray">
          You&apos;ll go to a secure card payment page. Your balance updates as soon as the payment is confirmed.
        </p>
        <FormError message={error} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={start.isPending}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={start.isPending}>
            <CreditCard className="h-4 w-4" />
            Continue to Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
