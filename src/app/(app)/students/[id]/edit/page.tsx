import type { Metadata } from "next";
import { EditStudentView } from "@/components/students/EditStudentForm";

export const metadata: Metadata = { title: "EduGear - Edit Student" };

export default async function EditStudentPage({ params }: PageProps<"/students/[id]/edit">) {
  const { id } = await params;
  return <EditStudentView id={id} />;
}
