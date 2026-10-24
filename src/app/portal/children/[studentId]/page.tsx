import type { Metadata } from "next";
import { PortalChildView } from "@/components/portal/PortalChildView";

export const metadata: Metadata = { title: "EduGear - Parent Portal" };

export default async function PortalChildPage({ params }: PageProps<"/portal/children/[studentId]">) {
  const { studentId } = await params;
  return <PortalChildView studentId={studentId} />;
}
