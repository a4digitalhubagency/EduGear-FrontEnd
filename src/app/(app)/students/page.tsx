import type { Metadata } from "next";
import { StudentsListView } from "@/components/students/StudentsListView";

export const metadata: Metadata = {
  title: "EduGear - Students",
};

/**
 * "Students - List View (Desktop)" screen — pulled from the Stitch design
 * system. See docs/ARCHITECTURE.md §3.4 for what's built vs pending here
 * (Add/Edit Student forms, Student Profile view, and Loading/Empty/Error
 * states are separate screens, not yet built).
 */
export default function StudentsPage() {
  return <StudentsListView />;
}