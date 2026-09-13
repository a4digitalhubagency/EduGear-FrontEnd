import { AlertTriangle, Briefcase, Coins, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AttendanceOverviewCard } from "@/components/dashboard/AttendanceOverviewCard";
import { NeedsAttentionCard } from "@/components/dashboard/NeedsAttentionCard";
import { FinanceHealthCard } from "@/components/dashboard/FinanceHealthCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";

/**
 * "School Administrator Dashboard - Overview" screen content. Replaces the
 * earlier Overview Dashboard build (attendance trends chart, fee collection
 * card, recent alerts, stat tiles), which was pulled from a different,
 * since-superseded card ("Application Shell - Desktop View") — see
 * docs/ARCHITECTURE.md §3.4 for the discrepancy this corrects. All figures
 * here are the Stitch mock's own placeholder numbers, not real data.
 */
export function DashboardOverview() {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Good morning, Dr. Ahmad</h1>
          <p className="mt-1 text-sm text-slate-gray">
            Here&apos;s what&apos;s happening at Al-Barka International School today.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="rounded-lg border border-slate-gray/15 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-gray">
              Academic Session
            </p>
            <p className="text-sm font-semibold text-primary-navy">2023/2024 Session</p>
          </div>
          <div className="rounded-lg border border-slate-gray/15 bg-white px-3 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-gray">
              Current Term
            </p>
            <p className="text-sm font-semibold text-primary-navy">Second Term</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          iconClassName="bg-blue-100 text-blue-700"
          badgeText="+12"
          badgeTone="positive"
          label="Total Students"
          value="1,248"
          caption="Active Registrations"
        />
        <StatCard
          icon={Briefcase}
          iconClassName="bg-slate-100 text-slate-600"
          badgeText="Steady"
          badgeTone="neutral"
          label="Total Staff"
          value="86"
          caption="Teaching & Non-Teaching"
        />
        <StatCard
          icon={Coins}
          iconClassName="bg-green-100 text-green-700"
          badgeText="+8%"
          badgeTone="positive"
          label="Fee Collection"
          value="₦42.8M"
          progressPercent={68}
        />
        <StatCard
          icon={AlertTriangle}
          iconClassName="bg-red-100 text-red-700"
          badgeText="324 students"
          badgeTone="negative"
          label="Outstanding Fees"
          value="₦20.1M"
          caption="Action Required"
          captionTone="negative"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceOverviewCard />
        </div>
        <NeedsAttentionCard />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FinanceHealthCard />
        <QuickActionsCard />
        <RecentActivityCard />
      </div>
    </div>
  );
}