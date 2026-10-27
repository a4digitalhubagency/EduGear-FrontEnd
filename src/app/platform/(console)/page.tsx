import type { Metadata } from "next";
import { PlatformConsole } from "@/components/platform/PlatformConsole";

export const metadata: Metadata = { title: "EduGear - Platform Console", robots: { index: false } };

export default function PlatformPage() {
  return <PlatformConsole />;
}
