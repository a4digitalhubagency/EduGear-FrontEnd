"use client";

import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api-client";
import { useSendReminders } from "@/lib/queries/finance";
import { formatNaira } from "@/lib/utils";
import type { SendRemindersInput, SendRemindersResult } from "@/types/finance";

/**
 * Fee reminders in two steps, because emails can't be unsent: first a dry run shows
 * exactly who would be emailed (and who can't be), then "Send" does it for real.
 * The cooldown is left to the school's own setting (Settings → Preferences).
 */
export function RemindersModal({ filters, onClose }: { filters: Pick<SendRemindersInput, "sessionId" | "classArmId">; onClose: () => void }) {
  const send = useSendReminders();
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<SendRemindersResult | null>(null);
  const [sent, setSent] = useState<SendRemindersResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const input = (dryRun: boolean): SendRemindersInput => ({
    ...filters,
    ...(message.trim() ? { message: message.trim() } : {}),
    dryRun,
  });

  async function run(dryRun: boolean) {
    setError(null);
    try {
      const result = await send.mutateAsync(input(dryRun));
      if (dryRun) setPreview(result);
      else setSent(result);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (sent) {
    return (
      <Modal title="Reminders Sent" onClose={onClose}>
        <div className="flex gap-3 rounded-lg bg-green-50 p-4 text-sm text-primary-navy">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold">
              {sent.sent} email{sent.sent === 1 ? "" : "s"} sent, covering {sent.studentsReminded} student
              {sent.studentsReminded === 1 ? "" : "s"}.
            </p>
            {sent.failed > 0 && <p className="mt-1 text-red-600">{sent.failed} couldn&apos;t be delivered.</p>}
          </div>
        </div>
        <Button type="button" className="mt-5" onClick={onClose}>
          Done
        </Button>
      </Modal>
    );
  }

  return (
    <Modal title="Send Fee Reminders" onClose={onClose} className="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-slate-gray">
          Emails each debtor&apos;s guardian how much is owed. One email covers all of a parent&apos;s children.
        </p>
        <Textarea
          label="Extra message (optional)"
          rows={3}
          placeholder="e.g. Kindly pay before the mid-term break."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setPreview(null); // the preview no longer matches what would be sent
          }}
        />

        {preview && (
          <div className="space-y-3 rounded-lg border border-slate-gray/10 p-4 text-sm">
            <p className="font-semibold text-primary-navy">
              {preview.sent} email{preview.sent === 1 ? "" : "s"} would be sent ({preview.debtors} debtor
              {preview.debtors === 1 ? "" : "s"} in total).
            </p>
            {preview.recipients.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-slate-gray">
                {preview.recipients.map((r) => (
                  <li key={r.email} className="flex justify-between gap-3">
                    <span>
                      {r.guardianName} · {r.email}
                    </span>
                    <span className="font-semibold text-primary-navy">{formatNaira(r.totalOwed)}</span>
                  </li>
                ))}
              </ul>
            )}
            {preview.skipped.length > 0 && (
              <p className="text-xs text-slate-gray">
                Skipped {preview.skipped.length}: reminded recently or a payment awaiting verification.
              </p>
            )}
            {preview.unreachable.length > 0 && (
              <div className="rounded-md bg-amber-50 p-2.5 text-xs text-primary-navy">
                <p className="font-semibold">{preview.unreachable.length} with no guardian email. Call instead:</p>
                <ul className="mt-1 space-y-0.5">
                  {preview.unreachable.map((u) => (
                    <li key={u.studentId}>
                      {u.studentName} ({formatNaira(u.amountOwed)}): {u.guardianPhones.join(", ") || "no phone on file"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <FormError message={error} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={send.isPending}>
            Cancel
          </Button>
          {preview ? (
            <Button
              type="button"
              className="w-auto flex-1"
              onClick={() => run(false)}
              isLoading={send.isPending}
              disabled={preview.sent === 0}
            >
              <Mail className="h-4 w-4" />
              Send {preview.sent} Email{preview.sent === 1 ? "" : "s"}
            </Button>
          ) : (
            <Button type="button" className="w-auto flex-1" onClick={() => run(true)} isLoading={send.isPending}>
              Preview Recipients
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
