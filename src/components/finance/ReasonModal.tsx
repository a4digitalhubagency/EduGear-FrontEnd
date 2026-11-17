"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api-client";
import { formatNaira, todayInput } from "@/lib/utils";

interface ReasonModalProps {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  /** Also ask for a naira amount (discounts), from 0 up to this value. */
  amountMax?: number;
  /** Starting amount, e.g. the invoice's current discount. */
  amountDefault?: number;
  amountLabel?: string;
  amountHint?: string;
  /** Under the reason box, e.g. who will read it. */
  reasonHint?: string;
  /** Also ask for an optional past date (refunds: when it happened), defaulting to today. */
  dateLabel?: string;
  /** Runs the action; the modal keeps itself open with the error if it fails. date is YYYY-MM-DD, or "" without dateLabel. */
  onConfirm: (values: { reason: string; amount: number; date: string }) => Promise<unknown>;
  onClose: () => void;
}

/**
 * Asks for a reason (and optionally an amount) before a finance action the backend
 * records with one: rejecting or refunding a payment, discounting, waiving or cancelling an invoice.
 */
export function ReasonModal({
  title,
  description,
  confirmLabel,
  tone = "primary",
  amountMax,
  amountDefault,
  amountLabel = "Amount (₦) *",
  amountHint,
  reasonHint,
  dateLabel,
  onConfirm,
  onClose,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(amountDefault ? String(amountDefault) : "");
  const [date, setDate] = useState(dateLabel ? todayInput() : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsAmount = amountMax !== undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (needsAmount && (amount.trim() === "" || !(value >= 0))) return setError("Enter an amount.");
    if (needsAmount && value > amountMax) return setError(`It can't be more than ${formatNaira(amountMax)}.`);
    if (dateLabel && !date) return setError("Enter the date.");
    if (dateLabel && date > todayInput()) return setError("The date can't be in the future.");
    if (!reason.trim()) return setError("Give a reason; it's kept on the record.");
    setError(null);
    setPending(true);
    try {
      await onConfirm({ reason: reason.trim(), amount: value, date });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-slate-gray">{description}</p>
        {needsAmount && (
          <div>
            <Input label={amountLabel} type="number" min={0} max={amountMax} value={amount} onChange={(e) => setAmount(e.target.value)} />
            {amountHint && <p className="mt-1.5 text-xs text-slate-gray">{amountHint}</p>}
          </div>
        )}
        {dateLabel && <Input label={dateLabel} type="date" max={todayInput()} value={date} onChange={(e) => setDate(e.target.value)} />}
        <div>
          <Textarea label="Reason *" rows={3} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} />
          {reasonHint && <p className="mt-1.5 text-xs text-slate-gray">{reasonHint}</p>}
        </div>
        <FormError message={error} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant={tone === "danger" ? "danger" : "primary"} className="w-auto flex-1" isLoading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
