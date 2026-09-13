import type { LucideIcon } from "lucide-react";

interface InfoRow {
  label: string;
  value: string;
}

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  rows: InfoRow[];
}

/**
 * Generic labeled-rows card, shared by the Student Profile's Personal
 * Information, Enrollment, and Guardian Details cards (Overview tab) — all
 * three are the same "icon + title, then label/value pairs" shape on the
 * Stitch screen, just with different data.
 */
export function InfoCard({ icon: Icon, title, rows }: InfoCardProps) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-bright-blue" />
        <h2 className="text-sm font-bold text-primary-navy">{title}</h2>
      </div>

      <dl className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
            <dt className="text-slate-gray">{row.label}</dt>
            <dd className="font-semibold text-primary-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}