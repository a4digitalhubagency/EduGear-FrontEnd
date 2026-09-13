import type { Metadata } from "next";
import { AddStudentForm } from "@/components/students/AddStudentForm";

export const metadata: Metadata = {
  title: "EduGear - Add Student",
};

/**
 * "Add Student - Form (Desktop)" screen — "New Admission" form. See
 * docs/ARCHITECTURE.md §3.4 for what's built vs pending here.
 */
export default function AddStudentPage() {
  return <AddStudentForm />;
}