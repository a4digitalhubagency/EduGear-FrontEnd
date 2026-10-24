import { Suspense } from "react";
import type { Metadata } from "next";
import { FinanceView } from "@/components/finance/FinanceView";

export const metadata: Metadata = { title: "EduGear - Finance" };

export default function FinancePage() {
  // FinanceView reads ?tab= / ?record= with useSearchParams, which Next requires to sit
  // inside a Suspense boundary (otherwise the production build fails for this page).
  return (
    <Suspense>
      <FinanceView />
    </Suspense>
  );
}
