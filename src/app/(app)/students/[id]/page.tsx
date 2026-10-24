import type { Metadata } from "next";
import { StudentProfileView } from "@/components/students/StudentProfileView";

export const metadata: Metadata = {
  title: "EduGear - Student Profile",
};

/**
 * "Student Profile - Overview (Desktop)" screen, at /students/[id]. The record is
 * fetched in the browser (GET /students/:id), since the session token lives in memory.
 */
export default async function StudentProfilePage({ params }: PageProps<"/students/[id]">) {
  const { id } = await params;
  return <StudentProfileView id={id} />;
}
