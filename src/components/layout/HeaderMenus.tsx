"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Bell,
  CalendarCog,
  Grid3x3,
  Loader2,
  LogOut,
  Receipt,
  Settings,
  UserCircle,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { AllClear, AttentionRow } from "@/components/dashboard/NeedsAttentionCard";
import { useAttentionItems } from "@/components/dashboard/useAttentionItems";
import { errorMessage } from "@/lib/api-client";
import { logout, switchSchool } from "@/lib/auth-actions";
import { useAuthStore, useCan } from "@/lib/store/auth-store";
import { cn, getInitials } from "@/lib/utils";

const ICON_BUTTON =
  "relative rounded-lg p-2 text-slate-gray hover:bg-cloud-sky/60 hover:text-primary-navy aria-expanded:bg-cloud-sky aria-expanded:text-primary-navy";

/**
 * The bell. Staff have no notifications endpoint (the backend only notifies parents),
 * so it shows what needs attention: the same live items as the dashboard card, with a
 * count badge when there are any.
 */
export function AttentionMenu() {
  const { items, loading } = useAttentionItems();
  return (
    <Popover
      className="w-80 p-3"
      trigger={({ open, toggle }) => (
        <button type="button" onClick={toggle} aria-expanded={open} aria-label={`Needs attention (${items.length})`} className={ICON_BUTTON}>
          <Bell className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center">
              {/* A soft pulse behind the count, so it's noticed without being noisy. */}
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-40 [animation-iteration-count:3]" />
              <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {items.length}
              </span>
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <p className="px-1 pb-2 text-sm font-bold text-primary-navy">Needs Attention</p>
          <div className="space-y-2">
            {items.length > 0 ? (
              items.map((item) => <AttentionRow key={item.key} item={item} onNavigate={close} />)
            ) : loading ? (
              <p className="inline-flex items-center gap-2 px-1 text-xs text-slate-gray">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking...
              </p>
            ) : (
              <AllClear />
            )}
          </div>
        </div>
      )}
    </Popover>
  );
}

type QuickLink = { label: string; href: string; icon: LucideIcon; permission: string };

const QUICK_LINKS: QuickLink[] = [
  { label: "Add Student", href: "/students/new", icon: UserPlus, permission: "students.create" },
  { label: "Record Payment", href: "/finance?tab=payments&record=1", icon: Receipt, permission: "finance.create" },
  { label: "Academic Setup", href: "/academics/setup", icon: CalendarCog, permission: "academics.read" },
  { label: "Invite Staff", href: "/personnel", icon: Users, permission: "users.create" },
  { label: "Settings", href: "/settings", icon: Settings, permission: "school.read" },
];

/** The grid icon: shortcuts to common tasks, limited to what the user is allowed to do. */
export function QuickLinksMenu() {
  const permissions = useAuthStore((s) => s.permissions);
  const links = QUICK_LINKS.filter((link) => permissions.includes(link.permission));
  if (links.length === 0) return null;

  return (
    <Popover
      className="w-64 p-2"
      trigger={({ open, toggle }) => (
        <button type="button" onClick={toggle} aria-expanded={open} aria-label="Quick links" className={cn(ICON_BUTTON, "hidden sm:block")}>
          <Grid3x3 className="h-5 w-5" />
        </button>
      )}
    >
      {(close) => (
        <div className="grid grid-cols-2 gap-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={close}
                className="flex flex-col items-center justify-center rounded-lg bg-cloud-sky/40 px-2 py-3 text-center hover:bg-cloud-sky"
              >
                <Icon className="h-5 w-5 text-bright-blue" />
                <span className="mt-1 text-xs font-semibold text-primary-navy">{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

/** The avatar: who you are, My Profile, switching school (if you belong to several), Log Out. */
export function ProfileMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeSchool = useAuthStore((s) => s.activeSchool);
  const memberships = useAuthStore((s) => s.memberships);
  const otherSchools = memberships.filter((m) => m.isActive && m.schoolId !== activeSchool?.schoolId);
  const isParent = useCan("portal.access");

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const name = user ? `${user.firstName} ${user.lastName}` : "";

  async function handleSwitch(schoolId: string) {
    setBusy(schoolId);
    setError(null);
    try {
      const permissions = await switchSchool(schoolId);
      router.replace(permissions.includes("portal.access") ? "/portal" : "/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleLogout() {
    setBusy("logout");
    await logout();
    router.replace("/login");
  }

  return (
    <Popover
      className="w-72 py-2"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label="Account menu"
          className="flex items-center gap-2.5 rounded-lg border-l border-slate-gray/10 py-1 pl-3 pr-2 text-left hover:bg-cloud-sky/40"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-navy text-sm font-semibold text-white">
            {getInitials(name)}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-primary-navy">{name}</p>
            <p className="text-xs text-slate-gray">{activeSchool?.roleName ?? ""}</p>
          </div>
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="border-b border-slate-gray/10 px-4 pb-3 pt-1">
            <p className="text-sm font-semibold text-primary-navy">{name}</p>
            <p className="truncate text-xs text-slate-gray">{user?.email}</p>
            <p className="mt-1 text-xs text-slate-gray">
              {activeSchool?.roleName} · {activeSchool?.schoolName}
            </p>
          </div>

          {!isParent && (
            <Link
              href="/profile"
              onClick={close}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-primary-navy hover:bg-cloud-sky/40"
            >
              <UserCircle className="h-4 w-4 text-slate-gray" />
              My Profile
            </Link>
          )}

          {otherSchools.length > 0 && (
            <div className="border-t border-slate-gray/10 py-1">
              <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Switch School</p>
              {otherSchools.map((m) => (
                <button
                  key={m.schoolId}
                  type="button"
                  onClick={() => handleSwitch(m.schoolId)}
                  disabled={!!busy}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-primary-navy hover:bg-cloud-sky/40 disabled:opacity-60"
                >
                  {busy === m.schoolId ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-gray" />
                  ) : (
                    <ArrowLeftRight className="h-4 w-4 text-slate-gray" />
                  )}
                  <span>
                    <span className="block font-medium">{m.schoolName}</span>
                    <span className="text-xs text-slate-gray">{m.roleName}</span>
                  </span>
                </button>
              ))}
              {error && <p className="px-4 py-1 text-xs font-medium text-red-600">{error}</p>}
            </div>
          )}

          <div className="border-t border-slate-gray/10 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              disabled={!!busy}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-gray hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            >
              {busy === "logout" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {busy === "logout" ? "Signing out..." : "Log Out"}
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}
