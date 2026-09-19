import type { Metadata } from "next";
import { AttendanceReportsView } from "@/components/academics/AttendanceReportsView";

export const metadata: Metadata = { title: "EduGear - Attendance Reports" };

export default function AttendanceReportsPage() {
  return <AttendanceReportsView />;
}