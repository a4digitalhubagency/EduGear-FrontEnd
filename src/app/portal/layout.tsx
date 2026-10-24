import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth/AuthGate";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <AuthGate area="portal">{children}</AuthGate>;
}
