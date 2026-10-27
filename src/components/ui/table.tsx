"use client";

import { ChevronLeft, ChevronRight, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/types/api";

/** Table card, header row and body row classes, as on the Students list. */
export const TABLE_CARD = "overflow-x-auto rounded-xl border border-slate-gray/10 bg-white";
export const TABLE_HEAD_ROW =
  "border-b border-slate-gray/10 text-xs font-semibold uppercase tracking-wide text-slate-gray";
export const TABLE_ROW = "border-b border-slate-gray/10 last:border-0 hover:bg-cloud-sky/20";

/**
 * Small square icon action for table rows (edit, delete). With disabledReason it stays
 * visible but inert, and the reason shows as its tooltip, e.g. why a delete is blocked.
 */
export function IconAction({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabledReason,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabledReason?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabledReason}
      aria-label={disabledReason ? `${label} (${disabledReason})` : label}
      title={disabledReason ?? label}
      className={cn(
        "rounded-md p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-gray",
        tone === "danger"
          ? "text-slate-gray hover:bg-red-50 hover:text-red-600"
          : "text-slate-gray hover:bg-cloud-sky/60 hover:text-bright-blue",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/** Loading / error / empty row spanning the whole table, like the Students list's empty row. */
export function TableStateRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-gray">
        {children}
      </td>
    </tr>
  );
}

export function LoadingText({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}

/** Retry link for a failed query, shown inside an error state. */
export function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <button type="button" onClick={onRetry} className="ml-1 font-semibold text-bright-blue hover:underline">
      Try again
    </button>
  );
}

/** Up to five page numbers centred on the current page. */
function pageWindow(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
}

/** "Showing 1–20 of 134 students" plus prev / page numbers / next, from a list's meta. */
export function PaginationFooter({
  meta,
  noun,
  onPageChange,
}: {
  meta: PaginationMeta | undefined;
  /** Plural noun for the count, e.g. "students". */
  noun: string;
  onPageChange: (page: number) => void;
}) {
  const first = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const last = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;
  const arrow =
    "rounded-md px-2.5 py-1.5 hover:bg-cloud-sky/60 disabled:cursor-not-allowed disabled:text-slate-gray/40 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-gray/10 px-4 py-3 text-sm text-slate-gray">
      <p>{meta ? `Showing ${first}–${last} of ${meta.total.toLocaleString()} ${noun}` : " "}</p>
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={!meta.hasPreviousPage}
            className={arrow}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageWindow(meta.page, meta.totalPages).map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => onPageChange(number)}
              aria-current={number === meta.page ? "page" : undefined}
              className={
                number === meta.page
                  ? "rounded-md bg-primary-navy px-3 py-1.5 font-semibold text-white"
                  : "rounded-md px-3 py-1.5 hover:bg-cloud-sky/60"
              }
            >
              {number}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={!meta.hasNextPage}
            className={arrow}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Underline tabs, as on the Student Profile header and Academic Setup. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div role="tablist" className="mt-5 flex gap-5 overflow-x-auto border-b border-slate-gray/10 text-sm font-semibold">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === active}
          onClick={(e) => {
            onChange(tab);
            // On a phone the row scrolls sideways: bring the chosen tab fully into view.
            e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
          }}
          className={
            tab === active
              ? "whitespace-nowrap border-b-2 transition-colors duration-200 border-bright-blue pb-3 text-bright-blue"
              : "whitespace-nowrap border-b-2 transition-colors duration-200 border-transparent pb-3 text-slate-gray hover:text-primary-navy"
          }
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/** Small uppercase pill, same shape as the student status badge. */
export function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Page header with breadcrumb-style subtitle, as on Attendance Reports and Academic Setup. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-primary-navy">{title}</h1>
        <p className="mt-1 text-sm text-slate-gray">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
