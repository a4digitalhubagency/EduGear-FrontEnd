"use client";

import { useState } from "react";
import { SchoolPreferencesForm } from "@/components/settings/SchoolPreferencesForm";
import { SchoolProfileForm } from "@/components/settings/SchoolProfileForm";
import { StorageSettings } from "@/components/settings/StorageSettings";
import { LoadingText, PageHeader, RetryButton, Tabs } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { useSchool, useSchoolSettings } from "@/lib/queries/school";
import { useCan } from "@/lib/store/auth-store";

const SETTINGS_TABS = ["School Profile", "Preferences", "Storage"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
      {children}
    </div>
  );
}

/**
 * Settings screen. No Stitch design exists; it reuses the Academic Setup layout
 * (underline tabs, white cards, the shared form controls). Needs school.read to view
 * and school.update to change anything; without it the forms render read-only.
 */
export function SettingsView() {
  const canRead = useCan("school.read");
  const canUpdate = useCan("school.update");
  const [tab, setTab] = useState<SettingsTab>(SETTINGS_TABS[0]);
  const school = useSchool();
  const settings = useSchoolSettings();

  const query = tab === "School Profile" ? school : settings;

  return (
    <div>
      <PageHeader title="Settings" description="Your school's details and how EduGear works for it." />

      {!canRead ? (
        <div className="mt-6">
          <StateCard>You don&apos;t have permission to view school settings.</StateCard>
        </div>
      ) : (
        <>
          <Tabs tabs={SETTINGS_TABS} active={tab} onChange={setTab} />
          <div className="mt-6">
            {tab === "Storage" ? (
              <StorageSettings canUpdate={canUpdate} />
            ) : query.isPending ? (
              <StateCard>
                <LoadingText label="Loading..." />
              </StateCard>
            ) : query.isError ? (
              <StateCard>
                {errorMessage(query.error)}
                <RetryButton onRetry={() => query.refetch()} />
              </StateCard>
            ) : tab === "School Profile" && school.data ? (
              // key: remount the form when the record changes elsewhere, so it never shows stale defaults
              <SchoolProfileForm key={school.data.id} school={school.data} canUpdate={canUpdate} />
            ) : settings.data ? (
              <SchoolPreferencesForm settings={settings.data} canUpdate={canUpdate} />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
