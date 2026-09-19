import type { Metadata } from "next";
import { StudentPromotionView } from "@/components/academics/StudentPromotionView";

export const metadata: Metadata = { title: "EduGear - Student Promotion" };

export default function StudentPromotionPage() {
  return <StudentPromotionView />;
}