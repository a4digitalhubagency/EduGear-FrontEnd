import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/auth/AuthGate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate area="staff">
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}