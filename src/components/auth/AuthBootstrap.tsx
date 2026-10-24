"use client";

import { useEffect } from "react";
import { useAuthStore, type AuthUser, type MembershipSummary } from "@/lib/store/auth-store";
import { api, refreshSession } from "@/lib/api-client";

type Profile = {
  user: AuthUser;
  activeSchool: MembershipSummary;
  memberships: MembershipSummary[];
  permissions: string[];
};

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const expiresAt = useAuthStore((s) => s.expiresAt);

  useEffect(() => {
    (async () => {
      try {
        if (!useAuthStore.getState().accessToken) {
          const restored = await refreshSession();
          if (restored) {
            const me = await api<Profile>("/auth/me");
            useAuthStore.setState({
              user: me.user,
              activeSchool: me.activeSchool,
              memberships: me.memberships,
              permissions: me.permissions,
            });
          }
        }
      } catch {
        useAuthStore.getState().clear();
      } finally {
        useAuthStore.getState().setReady();
      }
    })();
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const delay = Math.max(expiresAt - Date.now() - 60_000, 5_000);
    const timer = setTimeout(() => {
      void refreshSession();
    }, delay);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  return <>{children}</>;
}