"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingText, PaginationFooter, RetryButton, Tabs } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { useMarkAllNotificationsRead, useMarkNotificationRead, usePortalNotifications } from "@/lib/queries/portal";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { PortalNotification } from "@/types/portal";

const FILTERS = ["All", "Unread"] as const;

/** Where a notification leads: results and fee notices open the child's matching tab. */
function childLink(n: PortalNotification) {
  const studentId = typeof n.data.studentId === "string" ? n.data.studentId : null;
  return studentId ? `/portal/children/${studentId}` : null;
}

/** In-app notifications (GET /portal/notifications): mark one or all as read. */
export function PortalNotifications() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [page, setPage] = useState(1);
  const list = usePortalNotifications({ page, unreadOnly: filter === "Unread" || undefined });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div>
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-gray hover:text-primary-navy">
        <ArrowLeft className="h-4 w-4" />
        My children
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-primary-navy">Notifications</h1>
        {(list.data?.unread ?? 0) > 0 && (
          <Button type="button" variant="secondary" className="w-auto px-3 py-2" isLoading={markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>
      <Tabs
        tabs={FILTERS}
        active={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
      />

      <div className="mt-4">
        {list.isPending ? (
          <p className="rounded-xl border border-slate-gray/10 bg-white p-8 text-center text-sm text-slate-gray">
            <LoadingText label="Loading..." />
          </p>
        ) : list.isError ? (
          <p className="rounded-xl border border-slate-gray/10 bg-white p-8 text-center text-sm text-slate-gray">
            {errorMessage(list.error)}
            <RetryButton onRetry={() => list.refetch()} />
          </p>
        ) : list.data.data.length === 0 ? (
          <p className="rounded-xl border border-slate-gray/10 bg-white p-8 text-center text-sm text-slate-gray">
            <Bell className="mx-auto mb-2 h-6 w-6 text-slate-gray/40" />
            {filter === "Unread" ? "You're all caught up." : "No notifications yet."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-gray/10 overflow-hidden rounded-xl border border-slate-gray/10 bg-white">
              {list.data.data.map((n) => {
                const href = childLink(n);
                const body = (
                  <>
                    <span className="flex items-start justify-between gap-3">
                      <span className={cn("text-sm text-primary-navy", !n.read && "font-bold")}>{n.title}</span>
                      <span className="shrink-0 text-[11px] text-slate-gray">{formatRelativeTime(n.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-gray">{n.body}</span>
                  </>
                );
                // Opening an unread notice marks it read; the bell count refreshes with it.
                const open = () => !n.read && markRead.mutate(n.id);
                const rowClass = cn("block w-full px-4 py-3 text-left hover:bg-slate-50", !n.read && "border-l-2 border-bright-blue bg-cloud-sky/20");
                return (
                  <li key={n.id}>
                    {href ? (
                      <Link href={href} onClick={open} className={rowClass}>
                        {body}
                      </Link>
                    ) : (
                      <button type="button" onClick={open} className={rowClass}>
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <PaginationFooter meta={list.data.meta} noun="notifications" onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
