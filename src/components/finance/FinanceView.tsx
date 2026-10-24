"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DebtorsPanel } from "@/components/finance/DebtorsPanel";
import { InvoicesPanel } from "@/components/finance/InvoicesPanel";
import { OverviewPanel } from "@/components/finance/OverviewPanel";
import { PaymentsPanel } from "@/components/finance/PaymentsPanel";
import { StructuresPanel } from "@/components/finance/StructuresPanel";
import { Select } from "@/components/ui/Select";
import { PageHeader, Tabs } from "@/components/ui/table";
import { useSessions } from "@/lib/queries/academics";
import { useCan } from "@/lib/store/auth-store";

const FINANCE_TABS = ["Overview", "Payments", "Invoices", "Debtors", "Fee Structures"] as const;
type FinanceTab = (typeof FINANCE_TABS)[number];

/** ?tab= values for deep links, e.g. /finance?tab=payments&record=1 from "Record Payment". */
const TAB_PARAMS: Record<string, FinanceTab> = {
  overview: "Overview",
  payments: "Payments",
  invoices: "Invoices",
  debtors: "Debtors",
  structures: "Fee Structures",
};

/**
 * Finance screen (IA "Finance": fee structure, ledger, payments, debtors, receipts,
 * reports). No Stitch design exists; it reuses the dashboard's stat cards, the Students
 * list's table/filters, and Academic Setup's tabs and modals.
 *
 * The session picker scopes Overview, Invoices, Debtors and Fee Structures, and starts on
 * the current session. Payments list across sessions (the endpoint has no session filter).
 */
export function FinanceView() {
  const canRead = useCan("finance.read");
  const params = useSearchParams();
  const [tab, setTab] = useState<FinanceTab>(TAB_PARAMS[params.get("tab") ?? ""] ?? FINANCE_TABS[0]);
  // Read once: the panel opens its record form on arrival, then drops the flag from the URL.
  const [autoRecord] = useState(params.get("record") === "1");

  const sessions = useSessions();
  const sessionList = sessions.data?.data ?? [];
  // null until picked, so it can follow the current session once sessions load.
  const [picked, setPicked] = useState<string | null>(null);
  const sessionId = picked ?? sessionList.find((s) => s.isCurrent)?.id ?? sessionList[0]?.id;
  const sessionName = sessionList.find((s) => s.id === sessionId)?.name;
  const scoped = tab !== "Payments";

  return (
    <div>
      <PageHeader
        title="Finance"
        description="School fees: what's billed, what's been paid, and who still owes."
        actions={
          canRead && scoped && sessionList.length > 0 ? (
            <Select value={sessionId ?? ""} onChange={(e) => setPicked(e.target.value)} aria-label="Session">
              {sessionList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} Session{s.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />

      {!canRead ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
          You don&apos;t have permission to view school finances.
        </div>
      ) : (
        <>
          <Tabs tabs={FINANCE_TABS} active={tab} onChange={setTab} />
          <div className="mt-6">
            {tab === "Overview" ? (
              <OverviewPanel sessionId={sessionId} />
            ) : tab === "Payments" ? (
              <PaymentsPanel autoRecord={autoRecord} />
            ) : tab === "Invoices" ? (
              <InvoicesPanel sessionId={sessionId} />
            ) : tab === "Debtors" ? (
              <DebtorsPanel sessionId={sessionId} />
            ) : (
              <StructuresPanel sessionId={sessionId} sessionName={sessionName} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
