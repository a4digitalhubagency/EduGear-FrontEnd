"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ResultSheetsPanel } from "@/components/results/ResultSheetsPanel";
import { ScoreEntryPanel } from "@/components/results/ScoreEntryPanel";
import { PageHeader, Tabs } from "@/components/ui/table";
import { useCan } from "@/lib/store/auth-store";

const RESULTS_TABS = ["Score Entry", "Result Sheets"] as const;
type ResultsTab = (typeof RESULTS_TABS)[number];

/**
 * Results (IA: Results → Score Entry, Broadsheets, Report Cards, Result Approval).
 * ?tab=sheets opens Result Sheets, e.g. from the dashboard's "Generate Termly Reports".
 * Subjects, the assessment scheme and grading scale live in Academic Setup.
 */
export function ResultsView() {
  const canRead = useCan("results.read");
  const params = useSearchParams();
  const [tab, setTab] = useState<ResultsTab>(params.get("tab") === "sheets" ? "Result Sheets" : "Score Entry");

  return (
    <div>
      <PageHeader
        title="Results"
        description="Enter scores, compute class results, approve them and print report cards."
        actions={
          <Link href="/academics/setup" className="text-sm font-semibold text-bright-blue hover:underline">
            Subjects &amp; grading setup
          </Link>
        }
      />
      {!canRead ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
          You don&apos;t have access to results.
        </div>
      ) : (
        <>
          <Tabs tabs={RESULTS_TABS} active={tab} onChange={setTab} />
          <div className="mt-6">{tab === "Score Entry" ? <ScoreEntryPanel /> : <ResultSheetsPanel />}</div>
        </>
      )}
    </div>
  );
}
