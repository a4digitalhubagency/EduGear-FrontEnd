import type { Metadata } from "next";
import { AcademicSetupView } from "@/components/academics/setup/AcademicSetupView";

export const metadata: Metadata = { title: "EduGear - Academic Setup" };

export default function AcademicSetupPage() {
  return <AcademicSetupView />;
}
