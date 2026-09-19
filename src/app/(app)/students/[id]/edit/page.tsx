import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditStudentForm } from "@/components/students/EditStudentForm";
import { MOCK_STUDENT_PROFILES } from "@/lib/mock-student-profiles";

export const metadata: Metadata = { title: "EduGear - Edit Student" };

type EditStudentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { id } = await params;
  const student = MOCK_STUDENT_PROFILES[id];
  if (!student) {
    notFound();
  }
  return <EditStudentForm student={student} />;
}