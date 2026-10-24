import type { Metadata } from "next";
import { PortalHome } from "@/components/portal/PortalHome";

export const metadata: Metadata = { title: "EduGear - Parent Portal" };

export default function PortalPage() {
  return <PortalHome />;
}
