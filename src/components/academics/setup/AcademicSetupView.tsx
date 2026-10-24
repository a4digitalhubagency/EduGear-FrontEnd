"use client";

import { useState } from "react";
import Link from "next/link";
import { ClassesPanel } from "@/components/academics/setup/ClassesPanel";
import { GradingPanel } from "@/components/academics/setup/GradingPanel";
import { SessionsPanel } from "@/components/academics/setup/SessionsPanel";
import { SubjectsPanel } from "@/components/academics/setup/SubjectsPanel";
import { TermsPanel } from "@/components/academics/setup/TermsPanel";
import { Tabs } from "@/components/ui/table";
import { useCan } from "@/lib/store/auth-store";

const SETUP_TABS = ["Sessions", "Terms", "Classes & Arms", "Subjects", "Assessment & Grading"] as const;
type SetupTab = (typeof SETUP_TABS)[number];

/**
 * "Academic Setup" screen. There's no Stitch design for it, so it is assembled
 * from existing patterns: the breadcrumb header from Attendance Reports, the
 * underline tabs from the Student Profile header, the table card from the
 * Students list, and the modal/confirm layouts from the Guardian screens.
 * Order follows the dependency chain: terms need a session, arms need a class,
 * subjects are offered per class, and results need subjects plus a marking scheme.
 */
export function AcademicSetupView() {
  const [activeTab, setActiveTab] = useState<SetupTab>(SETUP_TABS[0]);
  const canRead = useCan("academics.read");

  return (
    <div>
      <p className="text-sm text-slate-gray">
        <Link href="/academics" className="text-primary-navy hover:underline">
          Academics
        </Link>{" "}
        / Setup
      </p>
      <h1 className="mt-1 text-2xl font-bold text-primary-navy">Academic Setup</h1>
      <p className="mt-1 text-sm text-slate-gray">
        Define your school&apos;s sessions, terms, classes, subjects and marking. Everything else in EduGear builds on these.
      </p>

      {!canRead ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
          You don&apos;t have permission to view academic setup. Ask your school administrator for access.
        </div>
      ) : (
        <>
          <Tabs tabs={SETUP_TABS} active={activeTab} onChange={setActiveTab} />
          <div className="mt-6">
            {activeTab === "Sessions" ? (
              <SessionsPanel />
            ) : activeTab === "Terms" ? (
              <TermsPanel />
            ) : activeTab === "Classes & Arms" ? (
              <ClassesPanel />
            ) : activeTab === "Subjects" ? (
              <SubjectsPanel />
            ) : (
              <GradingPanel />
            )}
          </div>
        </>
      )}
    </div>
  );
}
