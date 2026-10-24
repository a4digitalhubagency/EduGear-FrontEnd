import type { Metadata } from "next";
import { PersonnelView } from "@/components/personnel/PersonnelView";

export const metadata: Metadata = { title: "EduGear - Personnel" };

export default function PersonnelPage() {
  return <PersonnelView />;
}
