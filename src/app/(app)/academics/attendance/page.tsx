import type { Metadata } from "next";
import { AttendanceRegisterView } from "@/components/academics/AttendanceRegisterView";

export const metadata: Metadata = { title: "EduGear - Attendance Register" };

export default function AttendanceRegisterPage() {
  return <AttendanceRegisterView />;
}