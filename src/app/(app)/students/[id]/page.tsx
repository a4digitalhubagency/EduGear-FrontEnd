import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudentProfileView } from "@/components/students/StudentProfileView";
import { MOCK_STUDENT_PROFILES } from "@/lib/mock-student-profiles";

export const metadata: Metadata = {
  title: "EduGear - Student Profile",
};

/**
 * "Student Profile - Overview (Desktop)" screen, at /students/[id]. Looks
 * the id up in the mock profile map (see docs/ARCHITECTURE.md §3.4) — there's
 * no backend yet, and per the "no shared client state" decision, a student
 * added via the Add Student form won't have an id in this map, so its
 * "View Profile" link still falls back to the Students list instead of here.
 */
export default async function StudentProfilePage({
  params,
}: PageProps<"/students/[id]">) {
  const { id } = await params;
  const student = MOCK_STUDENT_PROFILES[id];

  if (!student) {
    notFound();
  }

  return <StudentProfileView student={student} />;
}