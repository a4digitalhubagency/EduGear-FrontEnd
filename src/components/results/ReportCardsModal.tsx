"use client";

import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PrintArea } from "@/components/ui/PrintArea";
import { LoadingText } from "@/components/ui/table";
import { ReportCardView } from "@/components/results/ReportCardView";
import { errorMessage } from "@/lib/api-client";
import { useClassReportCards } from "@/lib/queries/results";

interface ReportCardsModalProps {
  sheetId: string;
  /** Show only this student's card; omit for the whole class in position order. */
  studentId?: string;
  onClose: () => void;
}

/**
 * Report cards for a result sheet (GET /results/sheets/:id/report-cards), one student
 * or the whole class, ready to print: each card starts a new page, and <PrintArea> prints
 * just the cards, not the app around them.
 */
export function ReportCardsModal({ sheetId, studentId, onClose }: ReportCardsModalProps) {
  const cards = useClassReportCards(sheetId);
  const shown = (cards.data ?? []).filter((c) => !studentId || c.student.id === studentId);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-primary-navy/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl animate-dialog-in flex-col rounded-2xl bg-white shadow-xl">
        <div className="no-print flex items-center justify-between border-b border-slate-gray/10 px-6 py-4">
          <h2 className="text-lg font-bold text-primary-navy">
            {studentId ? "Report Card" : `Report Cards${cards.data ? ` (${shown.length})` : ""}`}
          </h2>
          <div className="flex items-center gap-2">
            {shown.length > 0 && (
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
        <div className="overflow-y-auto">
          {cards.isPending ? (
            <p className="p-10 text-center text-sm text-slate-gray">
              <LoadingText label="Preparing report cards..." />
            </p>
          ) : cards.isError ? (
            <p className="p-10 text-center text-sm text-slate-gray">{errorMessage(cards.error)}</p>
          ) : shown.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-gray">No report cards yet. Compute the results first.</p>
          ) : (
            <PrintArea className="divide-y divide-slate-gray/10">
              {shown.map((card) => (
                <ReportCardView key={card.student.id} card={card} />
              ))}
            </PrintArea>
          )}
        </div>
      </div>
    </div>
  );
}
