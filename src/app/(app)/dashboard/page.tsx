import type { Metadata } from "next";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export const metadata: Metadata = {
  title: "EduGear - Dashboard",
};

/**
 * "School Administrator Dashboard - Overview" screen. See
 * docs/ARCHITECTURE.md §3.4 for what changed here and why.
 */
export default function DashboardPage() {
  return <DashboardOverview />;
}