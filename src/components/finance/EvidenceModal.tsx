"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { LoadingText } from "@/components/ui/table";
import { apiBlob, backendPathFromUrl, errorMessage } from "@/lib/api-client";
import { formatNaira } from "@/lib/utils";
import type { Payment } from "@/types/finance";

/**
 * The proof a parent attached ("I've Paid"), so whoever verifies can check the teller or
 * transfer screenshot first. The file needs the staff member's token, so it's fetched here
 * and shown from memory rather than linked: a photo inline, a PDF in a frame.
 */
export function EvidenceModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const [file, setFile] = useState<{ url: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const path = payment.evidenceUrl ? backendPathFromUrl(payment.evidenceUrl) : null;
    let url: string | null = null;
    let cancelled = false;
    (path ? apiBlob(path) : Promise.reject(new Error("This proof isn't stored on EduGear.")))
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setFile({ url, type: blob.type });
      })
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [payment.evidenceUrl]);

  return (
    <Modal title="Proof of Payment" onClose={onClose} className="max-w-2xl">
      <p className="text-sm text-slate-gray">
        {formatNaira(payment.amount)} for <span className="font-semibold text-primary-navy">{payment.studentName}</span>
        {payment.reference && <> · Ref {payment.reference}</>}
      </p>
      <div className="mt-4 flex min-h-48 items-center justify-center rounded-lg border border-slate-gray/10 bg-slate-50 p-2">
        {error ? (
          <p className="text-sm text-slate-gray">{error}</p>
        ) : !file ? (
          <p className="text-sm text-slate-gray"><LoadingText label="Loading proof..." /></p>
        ) : file.type === "application/pdf" ? (
          <iframe src={file.url} title="Proof of payment" className="h-[60vh] w-full rounded" />
        ) : (
          // A blob from memory: next/image can't optimise it and has nothing to gain here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt="Proof of payment" className="max-h-[60vh] w-auto rounded" />
        )}
      </div>
      {file && (
        <a href={file.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-bright-blue hover:underline">
          <ExternalLink className="h-4 w-4" />
          Open full size
        </a>
      )}
    </Modal>
  );
}
