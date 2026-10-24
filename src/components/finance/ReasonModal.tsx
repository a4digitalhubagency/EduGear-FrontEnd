"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api-client";
import { formatNaira } from "@/lib/utils";

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
  /** Runs the action; the modal keeps itself open with the error if it fails. */
  onConfirm: (values: { reason: string; amount: number }) => Promise<unknown>;
  onClose: () => void;
}

/**
 * Asks for a reason (and optionally an amount) before a finance action the backend
 * records with one: rejecting a payment, discounting, waiving or cancelling an invoice.
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
  onConfirm,
  onClose,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(amountDefault ? String(amountDefault) : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsAmount = amountMax !== undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (needsAmount && (amount.trim() === "" || !(value >= 0))) return setError("Enter an amount.");
    if (needsAmount && value > amountMax) return setError(`It can't be more than ${formatNaira(amountMax)}.`);
    if (!reason.trim()) return setError("Give a reason; it's kept on the record.");
    setError(null);
    setPending(true);
    try {
      await onConfirm({ reason: reason.trim(), amount: value });
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
        <Textarea label="Reason *" rows={3} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} />
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
