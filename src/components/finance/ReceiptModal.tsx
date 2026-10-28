"use client";

import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PrintArea } from "@/components/ui/PrintArea";
import { LoadingText } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance-labels";
import { useFileUrl } from "@/lib/queries/files";
import { useReceipt } from "@/lib/queries/finance";
import { formatDate, formatNaira } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-slate-gray">{label}</dt>
      <dd className="text-right font-semibold text-primary-navy">{value}</dd>
    </div>
  );
}

/**
 * A verified payment's receipt (GET /finance/payments/:id/receipt), laid out to print
 * on its own: <PrintArea> prints just the receipt, not the app around it.
 */
export function ReceiptModal({ paymentId, path, onClose }: { paymentId: string; path?: string; onClose: () => void }) {
  const receipt = useReceipt(paymentId, path);
  const logo = useFileUrl(receipt.data?.school.logoUrl);
  const r = receipt.data;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center bg-primary-navy/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl animate-dialog-in">
        <div className="no-print flex items-center justify-between border-b border-slate-gray/10 px-6 py-4">
          <h2 className="text-lg font-bold text-primary-navy">Payment Receipt</h2>
          <div className="flex items-center gap-2">
            {r && (
              <Button type="button" variant="secondary" className="w-auto px-3 py-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="text-slate-gray hover:text-primary-navy">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {receipt.isPending ? (
          <p className="px-6 py-10 text-center text-sm text-slate-gray">
            <LoadingText label="Loading receipt..." />
          </p>
        ) : receipt.isError ? (
          <p className="px-6 py-10 text-center text-sm text-slate-gray">{errorMessage(receipt.error)}</p>
        ) : r ? (
          <PrintArea className="p-6">
            <div className="flex items-start gap-4 border-b border-slate-gray/10 pb-4">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element -- object/blob URLs can't go through next/image
                <img src={logo} alt="" className="h-14 w-14 object-contain" />
              )}
              <div>
                <p className="text-base font-bold text-primary-navy">{r.school.name}</p>
                {r.school.motto && <p className="text-xs italic text-slate-gray">{r.school.motto}</p>}
                <p className="mt-1 text-xs text-slate-gray">
                  {[r.school.addressLine, r.school.city, r.school.state].filter(Boolean).join(", ")}
                </p>
                <p className="text-xs text-slate-gray">{[r.school.phone, r.school.email].filter(Boolean).join(" · ")}</p>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-sm font-bold uppercase tracking-wide text-primary-navy">Official Receipt</p>
              <p className="text-sm font-semibold text-primary-navy">No. {r.receiptNumber}</p>
            </div>

            <dl className="mt-3 divide-y divide-slate-gray/10">
              <Row label="Student" value={`${r.student.fullName} (${r.student.admissionNumber})`} />
              {r.student.className && <Row label="Class" value={r.student.className} />}
              <Row label="For" value={r.feeDescription} />
              <Row label="Amount" value={formatNaira(r.amount)} />
              <Row label="Amount in words" value={<span className="font-medium italic">{r.amountInWords}</span>} />
              <Row label="Method" value={`${PAYMENT_METHOD_LABELS[r.method]}${r.reference ? ` · ${r.reference}` : ""}`} />
              <Row label="Paid on" value={formatDate(r.paidAt)} />
              <Row label="Invoice total" value={formatNaira(r.invoicePayable)} />
              <Row label="Paid to date" value={formatNaira(r.paidToDate)} />
              <Row label="Balance" value={formatNaira(r.balanceAfter)} />
            </dl>

            <p className="mt-4 text-xs text-slate-gray">
              Issued {formatDate(r.issuedAt)}
              {r.receivedBy && ` · Received by ${r.receivedBy}`}
            </p>
          </PrintArea>
        ) : null}
      </div>
    </div>
  );
}
