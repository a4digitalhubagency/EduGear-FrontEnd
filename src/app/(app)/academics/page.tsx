import type { Metadata } from "next";
import { AcademicsHubView } from "@/components/academics/AcademicsHubView";

export const metadata: Metadata = { title: "EduGear - Academics" };

export default function AcademicsPage() {
  return <AcademicsHubView />;
}