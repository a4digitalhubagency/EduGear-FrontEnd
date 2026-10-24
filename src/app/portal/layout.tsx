import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { PortalShell } from "@/components/portal/PortalShell";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate area="portal">
      <PortalShell>{children}</PortalShell>
    </AuthGate>
  );
}
