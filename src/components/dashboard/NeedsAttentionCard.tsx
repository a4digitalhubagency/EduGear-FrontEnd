import { AlertTriangle, ClipboardX, TriangleAlert, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AttentionItem {
  icon: typeof TriangleAlert;
  iconClassName: string;
  bgClassName: string;
  title: string;
  detail: string;
}

const ITEMS: AttentionItem[] = [
  {
    icon: AlertTriangle,
    iconClassName: "text-red-600",
    bgClassName: "bg-red-50",
    title: "24 students have outstanding fees",
    detail: "Deadline for exam clearance passed yesterday.",
  },
  {
    icon: ClipboardX,
    iconClassName: "text-amber-600",
    bgClassName: "bg-amber-50",
    title: "3 teachers missing results",
    detail: "Basic Science & English Language (JSS3 arm).",
  },
  {
    icon: UserCheck,
    iconClassName: "text-slate-600",
    bgClassName: "bg-slate-100",
    title: "2 user accounts pending",
    detail: "New staff registrations awaiting verification.",
  },
];

/** "Needs Attention" card — short list of admin tasks that need action. */
export function NeedsAttentionCard() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-gray/10 bg-white p-5">
      <div className="flex items-center gap-1.5">
        <TriangleAlert className="h-4 w-4 text-red-500" />
        <h2 className="text-sm font-bold text-primary-navy">Needs Attention</h2>
      </div>

      <div className="mt-3 flex-1 space-y-2.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className={`flex gap-2.5 rounded-lg p-3 ${item.bgClassName}`}>
              <Icon className={`h-4 w-4 shrink-0 ${item.iconClassName}`} />
              <div>
                <p className="text-xs font-semibold text-primary-navy">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-gray">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="secondary" className="mt-3">
        View All Tasks
      </Button>
    </div>
  );
}