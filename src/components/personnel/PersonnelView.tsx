"use client";

import { useState } from "react";
import { RolesPanel } from "@/components/personnel/RolesPanel";
import { StaffPanel } from "@/components/personnel/StaffPanel";
import { PageHeader, Tabs } from "@/components/ui/table";
import { useCan } from "@/lib/store/auth-store";

const PERSONNEL_TABS = ["Staff", "Roles"] as const;
type PersonnelTab = (typeof PERSONNEL_TABS)[number];

/**
 * Personnel screen (staff accounts and roles). No Stitch design exists; it follows
 * the Students list (search/filter row, table card, pagination) and Academic Setup
 * (underline tabs, modals, confirm dialogs).
 */
export function PersonnelView() {
  const canRead = useCan("users.read");
  const [tab, setTab] = useState<PersonnelTab>(PERSONNEL_TABS[0]);

  return (
    <div>
      <PageHeader title="Personnel" description="Your school's staff accounts and what each role can do." />

      {!canRead ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
          You don&apos;t have permission to view staff accounts.
        </div>
      ) : (
        <>
          <Tabs tabs={PERSONNEL_TABS} active={tab} onChange={setTab} />
          <div className="mt-6">{tab === "Staff" ? <StaffPanel /> : <RolesPanel />}</div>
        </>
      )}
    </div>
  );
}
