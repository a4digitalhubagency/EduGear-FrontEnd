"use client";

import { useState } from "react";
import Link from "next/link";
import { ClassesPanel } from "@/components/academics/setup/ClassesPanel";
import { SessionsPanel } from "@/components/academics/setup/SessionsPanel";
import { TermsPanel } from "@/components/academics/setup/TermsPanel";
import { useCan } from "@/lib/store/auth-store";

const SETUP_TABS = ["Sessions", "Terms", "Classes & Arms"] as const;
type SetupTab = (typeof SETUP_TABS)[number];

/**
 * "Academic Setup" screen. There's no Stitch design for it, so it is assembled
 * from existing patterns: the breadcrumb header from Attendance Reports, the
 * underline tabs from the Student Profile header, the table card from the
 * Students list, and the modal/confirm layouts from the Guardian screens.
 * Order follows the dependency chain: terms need a session, arms need a class,
 * and attendance, promotion and students all need these in place first.
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
        Define your school&apos;s sessions, terms, classes and arms. Everything else in EduGear builds on these.
      </p>

      {!canRead ? (
        <div className="mt-6 rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
          You don&apos;t have permission to view academic setup. Ask your school administrator for access.
        </div>
      ) : (
        <>
          <div role="tablist" className="mt-5 flex gap-5 border-b border-slate-gray/10 text-sm font-semibold">
            {SETUP_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={tab === activeTab}
                onClick={() => setActiveTab(tab)}
                className={
                  tab === activeTab
                    ? "border-b-2 transition-colors duration-200 border-bright-blue pb-3 text-bright-blue"
                    : "border-b-2 transition-colors duration-200 border-transparent pb-3 text-slate-gray hover:text-primary-navy"
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === "Sessions" ? <SessionsPanel /> : activeTab === "Terms" ? <TermsPanel /> : <ClassesPanel />}
          </div>
        </>
      )}
    </div>
  );
}
