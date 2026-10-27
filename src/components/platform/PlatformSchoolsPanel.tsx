"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatBytes } from "@/components/settings/StorageSettings";
import {
  LoadingText, PaginationFooter, Pill, RetryButton, TABLE_ROW,  TABLE_HEAD_ROW, TABLE_CARD,
} from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { type SchoolsQuery, usePlatformSchools, useSchoolAction } from "@/lib/queries/platform";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { SCHOOL_STATUSES, type PlatformSchool, type SchoolStatus } from "@/types/platform";

const STATUS_STYLES: Record<SchoolStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-gray/10 text-slate-gray",
};
const statusLabel = (s: SchoolStatus) => s.charAt(0) + s.slice(1).toLowerCase();

type Action = "suspend" | "reactivate" | "cancel" | "quota";

const ACTION_COPY: Record<Exclude<Action, "quota">, { title: string; body: string; button: string }> = {
  suspend: { title: "Suspend School", body: "Every login at this school stops working immediately. No data is deleted.", button: "Suspend" },
  cancel: {
    title: "Cancel School",
    body: "The school is marked cancelled and its logins stop. Nothing is destroyed, so reactivating restores it intact.",
    button: "Cancel School",
  },
  reactivate: { title: "Reactivate School", body: "Logins at this school start working again straight away.", button: "Reactivate" },
};

function ActionModal({ school, action, onClose }: { school: PlatformSchool; action: Action; onClose: () => void }) {
  const run = useSchoolAction();
  const [reason, setReason] = useState("");
  const [quota, setQuota] = useState(school.storageQuotaIsCustom ? String(school.storageQuotaMb) : "");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let storageQuotaMb: number | null | undefined;
    if (action === "quota") {
      storageQuotaMb = quota.trim() === "" ? null : Number(quota);
      if (storageQuotaMb !== null && !(Number.isInteger(storageQuotaMb) && storageQuotaMb >= 1 && storageQuotaMb <= 1_000_000)) {
        return setError("Enter whole megabytes between 1 and 1,000,000, or leave it blank for the default.");
      }
    } else if (action !== "reactivate" && !reason.trim()) {
      return setError("Give a reason. It's recorded on the school's audit trail.");
    }
    setError(null);
    try {
      await run.mutateAsync({ id: school.id, action, reason: reason.trim(), storageQuotaMb });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const copy = action === "quota" ? null : ACTION_COPY[action];
  return (
    <Modal title={copy?.title ?? "Storage Ceiling"} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm text-slate-gray">
          <span className="font-semibold text-primary-navy">{school.name}</span>
          {copy ? `: ${copy.body}` : ` uses ${formatBytes(school.storageBytes)} of ${school.storageQuotaMb.toLocaleString()} MB.`}
        </p>
        {action === "quota" ? (
          <Input
            label="Ceiling (MB)"
            type="number"
            min={1}
            placeholder="Blank = platform default"
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
          />
        ) : action !== "reactivate" ? (
          <Textarea label="Reason *" rows={2} maxLength={255} placeholder="e.g. Subscription unpaid since September" value={reason} onChange={(e) => setReason(e.target.value)} />
        ) : null}
        <FormError message={error} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={run.isPending}>
            Close
          </Button>
          <Button type="submit" className={cn("w-auto flex-1", (action === "suspend" || action === "cancel") && "bg-red-600 hover:bg-red-700")} isLoading={run.isPending}>
            {copy?.button ?? "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SchoolDetail({ school, canChange, onAction }: { school: PlatformSchool; canChange: boolean; onAction: (a: Action) => void }) {
  const rows: [string, React.ReactNode][] = [
    ["Email", school.email],
    ["Phone", school.phone ?? "—"],
    ["State", school.state ?? "—"],
    ["Proprietor", school.ownerEmail ?? "—"],
    ["Registered", formatDate(school.createdAt)],
    ["Last staff login", school.lastActivityAt ? formatRelativeTime(school.lastActivityAt) : "Never"],
    ["Students / Staff / Class arms", `${school.studentCount} / ${school.staffCount} / ${school.classArmCount}`],
    ["Storage", `${formatBytes(school.storageBytes)} of ${school.storageQuotaMb.toLocaleString()} MB${school.storageQuotaIsCustom ? " (custom)" : " (default)"}`],
  ];
  return (
    <div>
      <dl className="divide-y divide-slate-gray/10 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="text-slate-gray">{k}</dt>
            <dd className="text-right font-medium text-primary-navy">{v}</dd>
          </div>
        ))}
      </dl>
      {canChange && (
        <div className="mt-5 flex flex-wrap gap-2">
          {school.status === "ACTIVE" || school.status === "PENDING" ? (
            <Button type="button" variant="secondary" className="w-auto px-3 py-2" onClick={() => onAction("suspend")}>
              Suspend
            </Button>
          ) : (
            <Button type="button" className="w-auto px-3 py-2" onClick={() => onAction("reactivate")}>
              Reactivate
            </Button>
          )}
          {school.status !== "CANCELLED" && (
            <Button type="button" variant="secondary" className="w-auto px-3 py-2 text-red-600" onClick={() => onAction("cancel")}>
              Cancel School
            </Button>
          )}
          <Button type="button" variant="secondary" className="w-auto px-3 py-2" onClick={() => onAction("quota")}>
            Storage Ceiling
          </Button>
        </div>
      )}
    </div>
  );
}

/** Every school: filter by status, sort, open one for its details and (operators/owners) actions. */
export function PlatformSchoolsPanel({ canChange }: { canChange: boolean }) {
  const [query, setQuery] = useState<SchoolsQuery>({ page: 1, sortBy: "createdAt", sortOrder: "desc" });
  const schools = usePlatformSchools(query);
  const [openId, setOpenId] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  // Read the open school from the list so it reflects changes after an action.
  const open = schools.data?.data.find((s) => s.id === openId) ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Status"
          value={query.status ?? ""}
          onChange={(e) => setQuery((q) => ({ ...q, page: 1, status: (e.target.value || undefined) as SchoolStatus | undefined }))}
        >
          <option value="">All statuses</option>
          {SCHOOL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Sort"
          value={`${query.sortBy}:${query.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split(":") as [SchoolsQuery["sortBy"], SchoolsQuery["sortOrder"]];
            setQuery((q) => ({ ...q, page: 1, sortBy, sortOrder }));
          }}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="name:asc">Name A–Z</option>
          <option value="status:asc">Status</option>
        </Select>
      </div>

      <div className={cn(TABLE_CARD, "mt-4")}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Storage</th>
              <th className="px-4 py-3">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {schools.isPending ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-gray">
                  <LoadingText label="Loading schools..." />
                </td>
              </tr>
            ) : schools.isError ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-gray">
                  {errorMessage(schools.error)}
                  <RetryButton onRetry={() => schools.refetch()} />
                </td>
              </tr>
            ) : schools.data.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-gray">
                  No schools{query.status ? ` with status ${statusLabel(query.status).toLowerCase()}` : ""}.
                </td>
              </tr>
            ) : (
              schools.data.data.map((s) => (
                <tr key={s.id} className={cn(TABLE_ROW, "cursor-pointer")} onClick={() => setOpenId(s.id)}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary-navy">{s.name}</p>
                    <p className="text-xs text-slate-gray">{s.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Pill className={STATUS_STYLES[s.status]}>{statusLabel(s.status)}</Pill>
                  </td>
                  <td className="px-4 py-3">{s.studentCount}</td>
                  <td className="px-4 py-3">{s.staffCount}</td>
                  <td className="px-4 py-3">
                    {formatBytes(s.storageBytes)}
                    <span className="text-xs text-slate-gray"> / {s.storageQuotaMb.toLocaleString()} MB</span>
                  </td>
                  <td className={cn("px-4 py-3", "text-xs text-slate-gray")}>{s.lastActivityAt ? formatRelativeTime(s.lastActivityAt) : "Never"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaginationFooter meta={schools.data?.meta} noun="schools" onPageChange={(page) => setQuery((q) => ({ ...q, page }))} />

      {open && !action && (
        <Modal title={open.name} onClose={() => setOpenId(null)} className="max-w-lg">
          <Pill className={STATUS_STYLES[open.status]}>{statusLabel(open.status)}</Pill>
          <div className="mt-3">
            <SchoolDetail school={open} canChange={canChange} onAction={setAction} />
          </div>
        </Modal>
      )}
      {open && action && <ActionModal school={open} action={action} onClose={() => setAction(null)} />}
    </div>
  );
}
