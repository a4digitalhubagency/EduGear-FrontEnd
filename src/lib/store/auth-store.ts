import { create } from "zustand";

export type AuthUser = {
  id: string; email: string; firstName: string; lastName: string;
  phone: string | null; emailVerified: boolean;
};

export type MembershipSummary = {
  membershipId: string; schoolId: string; schoolName: string; schoolSlug: string;
  roleName: string; roleSlug: string; isActive: boolean;
};

type Session = {
  accessToken: string;
  expiresIn: number; // seconds, straight from the backend
  user: AuthUser;
  activeSchool: MembershipSummary;
  memberships: MembershipSummary[];
  permissions: string[];
};

type AuthState = {
  accessToken: string | null;
  expiresAt: number | null;   // epoch ms; lets us refresh BEFORE the token dies
  user: AuthUser | null;
  activeSchool: MembershipSummary | null;
  memberships: MembershipSummary[];
  permissions: string[];
  ready: boolean;             // true once the first silent-refresh attempt has finished
  setSession: (s: Session) => void;
  setToken: (accessToken: string, expiresIn: number) => void;
  clear: () => void;
  setReady: () => void;
  can: (permission: string) => boolean;
};

// Deliberately NOT persisted: no localStorage, no cookies. Memory only.
export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null, expiresAt: null, user: null, activeSchool: null,
  memberships: [], permissions: [], ready: false,

  setSession: (s) => set({
    accessToken: s.accessToken,
    expiresAt: Date.now() + s.expiresIn * 1000,
    user: s.user, activeSchool: s.activeSchool,
    memberships: s.memberships, permissions: s.permissions,
  }),

  // Used after a plain refresh: new token, same user/permissions.
  setToken: (accessToken, expiresIn) =>
    set({ accessToken, expiresAt: Date.now() + expiresIn * 1000 }),

  clear: () => set({
    accessToken: null, expiresAt: null, user: null, activeSchool: null,
    memberships: [], permissions: [],
  }),

  setReady: () => set({ ready: true }),

  can: (permission) => get().permissions.includes(permission),
}));

/** Reactive form of can(): re-renders when permissions change. UI-only; the server always enforces. */
export function useCan(permission: string) {
  return useAuthStore((s) => s.permissions.includes(permission));
}