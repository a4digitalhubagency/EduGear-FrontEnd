import { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = { title: "EduGear - Settings" };

export default function SettingsPage() {
  // SettingsView reads ?tab= with useSearchParams, which Next requires inside a Suspense boundary.
  return (
    <Suspense>
      <SettingsView />
    </Suspense>
  );
}
