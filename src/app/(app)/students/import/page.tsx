import type { Metadata } from "next";
import { BulkImportStudentsView } from "@/components/students/BulkImportStudentsView";

export const metadata: Metadata = { title: "EduGear - Bulk Import Students" };

export default function BulkImportStudentsPage() {
  return <BulkImportStudentsView />;
}