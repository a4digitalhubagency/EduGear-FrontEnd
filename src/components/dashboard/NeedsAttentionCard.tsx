"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useAttentionItems, type AttentionItem } from "@/components/dashboard/useAttentionItems";

/** One attention item, as a link when it has somewhere to go. Shared with the header bell. */
export function AttentionRow({ item, onNavigate }: { item: AttentionItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon className={`h-4 w-4 shrink-0 ${item.iconClassName}`} />
      <div>
        <p className="text-xs font-semibold text-primary-navy">{item.title}</p>
        <p className="mt-0.5 text-xs text-slate-gray">{item.detail}</p>
      </div>
    </>
  );
  return item.href ? (
    <Link href={item.href} onClick={onNavigate} className={`flex gap-2.5 rounded-lg p-3 hover:opacity-80 ${item.bgClassName}`}>
      {content}
    </Link>
  ) : (
    <div className={`flex gap-2.5 rounded-lg p-3 ${item.bgClassName}`}>{content}</div>
  );
}

export function AllClear() {
  return (
    <div className="flex gap-2.5 rounded-lg bg-green-50 p-3">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      <p className="text-xs font-semibold text-primary-navy">All clear. Nothing needs your attention right now.</p>
    </div>
  );
}

/** "Needs Attention" card, from live counts (see useAttentionItems). */
export function NeedsAttentionCard() {
  const { items, loading } = useAttentionItems();

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <h2 className="text-sm font-bold text-primary-navy">Needs Attention</h2>
      </div>

      <div className="mt-3 flex-1 space-y-2.5">
        {items.length > 0 ? (
          items.map((item) => <AttentionRow key={item.key} item={item} />)
        ) : loading ? (
          <p className="inline-flex items-center gap-2 text-sm text-slate-gray">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking...
          </p>
        ) : (
          <AllClear />
        )}
      </div>
    </div>
  );
}
