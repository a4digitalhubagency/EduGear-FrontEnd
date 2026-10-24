import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultsView } from "@/components/results/ResultsView";

export const metadata: Metadata = { title: "EduGear - Results" };

export default function ResultsPage() {
  // ResultsView reads ?tab= with useSearchParams, which Next requires inside a Suspense boundary.
  return (
    <Suspense>
      <ResultsView />
    </Suspense>
  );
}
