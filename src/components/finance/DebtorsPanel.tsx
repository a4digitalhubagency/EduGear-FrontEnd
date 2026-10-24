"use client";

import { useState } from "react";
import { Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  LoadingText,
  PaginationFooter,
  Pill,
  RetryButton,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TableStateRow,
} from "@/components/ui/table";
import { RemindersModal } from "@/components/finance/RemindersModal";
import { errorMessage } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks";
import { useClassArms } from "@/lib/queries/academics";
import { useDebtors } from "@/lib/queries/finance";
import { useCan } from "@/lib/store/auth-store";
import { cn, formatDate, formatNaira, formatRelativeTime } from "@/lib/utils";

const COLUMNS = 6;

/** Debtors tab: students who still owe, largest debt first, with guardian contacts and reminders. */
export function DebtorsPanel({ sessionId }: { sessionId: string | undefined }) {
  const canRemind = useCan("finance.update");
  const arms = useClassArms();

  const [search, setSearch] = useState("");
  const [classArmId, setClassArmId] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search);
  const [reminding, setReminding] = useState(false);

  const debtors = useDebtors({
    page,
    limit: 20,
    sessionId,
    search: debounced.trim() || undefined,
    classArmId: classArmId || undefined,
    overdueOnly: overdueOnly || undefined,
  });
  const rows = debtors.data?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            icon={Search}
            placeholder="Search student..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="py-2.5"
            aria-label="Search debtors"
          />
        </div>
        <Select
          value={classArmId}
          onChange={(e) => {
            setClassArmId(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by class arm"
        >
          <option value="">All Arms</option>
          {(arms.data?.data ?? []).map((arm) => (
            <option key={arm.id} value={arm.id}>
              {arm.fullName}
            </option>
          ))}
        </Select>
        <Checkbox
          label="Overdue only"
          checked={overdueOnly}
          onChange={(e) => {
            setOverdueOnly(e.target.checked);
            setPage(1);
          }}
        />
        {canRemind && (
          <Button
            type="button"
            className="w-auto px-4 py-2.5"
            onClick={() => setReminding(true)}
            disabled={debtors.data?.meta.total === 0}
          >
            <Mail className="h-4 w-4" />
            Send Reminders
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
        <table className={cn("w-full min-w-[880px] text-left text-sm", debtors.isPlaceholderData && "opacity-60")}>
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Owes</th>
              <th className="px-4 py-3">Invoices</th>
              <th className="px-4 py-3">Earliest Due</th>
              <th className="px-4 py-3">Guardian Contacts</th>
              <th className="px-4 py-3">Last Reminded</th>
            </tr>
          </thead>
          <tbody>
            {debtors.isPending ? (
              <TableStateRow colSpan={COLUMNS}>
                <LoadingText label="Loading debtors..." />
              </TableStateRow>
            ) : debtors.isError ? (
              <TableStateRow colSpan={COLUMNS}>
                {errorMessage(debtors.error)}
                <RetryButton onRetry={() => debtors.refetch()} />
              </TableStateRow>
            ) : rows.length === 0 ? (
              <TableStateRow colSpan={COLUMNS}>Nobody owes fees for these filters.</TableStateRow>
            ) : (
              rows.map((d) => (
                <tr key={d.studentId} className={TABLE_ROW}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary-navy">{d.studentName}</p>
                    <p className="text-xs text-slate-gray">
                      {d.admissionNumber}
                      {d.className ? ` · ${d.className}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-red-600">{formatNaira(d.totalOwed)}</td>
                  <td className="px-4 py-3 text-slate-gray">{d.invoiceCount}</td>
                  <td className="px-4 py-3 text-slate-gray">
                    {d.earliestDueDate ? formatDate(d.earliestDueDate) : "—"}
                    {d.isOverdue && (
                      <div className="mt-1">
                        <Pill className="bg-red-100 text-red-700">Overdue</Pill>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-gray">
                    {d.guardianContacts.length ? d.guardianContacts.map((c) => <p key={c}>{c}</p>) : "None on file"}
                  </td>
                  <td className="px-4 py-3 text-slate-gray">
                    {d.lastRemindedAt ? formatRelativeTime(d.lastRemindedAt) : "Never"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <PaginationFooter meta={debtors.data?.meta} noun="debtors" onPageChange={setPage} />
      </div>

      {reminding && (
        <RemindersModal filters={{ sessionId, classArmId: classArmId || undefined }} onClose={() => setReminding(false)} />
      )}
    </div>
  );
}
