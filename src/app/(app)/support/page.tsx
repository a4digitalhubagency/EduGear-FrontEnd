import type { Metadata } from "next";
import { SupportView } from "@/components/support/SupportView";

export const metadata: Metadata = { title: "EduGear - Support" };

export default function SupportPage() {
  return <SupportView />;
}
