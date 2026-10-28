"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, GraduationCap, HardDrive, KeyRound, LogOut, Users } from "lucide-react";
import { EduGearLogo } from "@/components/EduGearLogo";
import { PlatformAdminsPanel } from "@/components/platform/PlatformAdminsPanel";
import { PlatformPasswordModal } from "@/components/platform/PlatformPasswordModal";
import { PlatformSchoolsPanel } from "@/components/platform/PlatformSchoolsPanel";
import { formatBytes } from "@/components/settings/StorageSettings";
import { LoadingText, RetryButton, Tabs } from "@/components/ui/table";
import { ApiError, errorMessage } from "@/lib/api-client";
import { usePlatformMe, usePlatformStats } from "@/lib/queries/platform";
import type { PlatformOperator } from "@/types/platform";

function Stat({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-gray">
        <Icon className="h-4 w-4 text-bright-blue" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-primary-navy">{value}</p>
      {note && <p className="mt-0.5 text-xs text-slate-gray">{note}</p>}
    </div>
  );
}

function Overview() {
  const stats = usePlatformStats();
  if (stats.isPending) return <p className="py-10 text-center text-sm text-slate-gray"><LoadingText label="Loading..." /></p>;
  if (stats.isError) return <p className="py-10 text-center text-sm text-slate-gray">{errorMessage(stats.error)}<RetryButton onRetry={() => stats.refetch()} /></p>;
  const s = stats.data;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat icon={Building2} label="Schools" value={s.totalSchools} note={`${s.newSchoolsLast30Days} new in the last 30 days`} />
      <Stat
        icon={Building2}
        label="Active Schools"
        value={s.activeSchools}
        note={`${s.pendingSchools} pending · ${s.suspendedSchools} suspended · ${s.cancelledSchools} cancelled`}
      />
      <Stat icon={GraduationCap} label="Active Students" value={s.totalStudents.toLocaleString()} />
      <Stat icon={Users} label="Staff" value={s.totalStaff.toLocaleString()} />
      <Stat icon={HardDrive} label="Storage Used" value={formatBytes(s.storageBytes)} />
    </div>
  );
}

function ConsoleBody({ me }: { me: PlatformOperator }) {
  const tabs = me.role === "OWNER" ? (["Overview", "Schools", "Operators"] as const) : (["Overview", "Schools"] as const);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  return (
    <>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === "Overview" ? <Overview /> : tab === "Schools" ? <PlatformSchoolsPanel canChange={me.role !== "SUPPORT"} /> : <PlatformAdminsPanel me={me} />}
      </div>
    </>
  );
}

/**
 * A4's console: platform totals, every school (status, usage, suspend / reactivate /
 * cancel, storage ceiling) and, for owners, who has platform access. Metadata only;
 * the backend never exposes a school's students, fees or results here.
 */
export function PlatformConsole() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = usePlatformMe();

  // The session lasts 15 minutes and can't be refreshed: any platform query or action
  // answering 401 means it ended, so go back to sign-in.
  useEffect(() => {
    const expired = (error: unknown) => error instanceof ApiError && error.status === 401;
    const toLogin = () => router.replace("/platform/login?expired=1");
    const unsubQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === "platform" && expired(event.query.state.error)) toLogin();
    });
    const unsubMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.mutation && expired(event.mutation.state.error)) toLogin();
    });
    return () => {
      unsubQueries();
      unsubMutations();
    };
  }, [queryClient, router]);

  const [changingPassword, setChangingPassword] = useState(false);

  async function signOut(to = "/platform/login") {
    await fetch("/api/platform/session", { method: "DELETE" }).catch(() => null);
    queryClient.removeQueries({ queryKey: ["platform"] });
    router.replace(to);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-gray/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <EduGearLogo />
            <span className="rounded-full bg-primary-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Platform</span>
          </div>
          <div className="flex items-center gap-3">
            {me.data && (
              <span className="hidden text-right text-xs sm:block">
                <span className="block font-semibold text-primary-navy">{me.data.email}</span>
                <span className="text-slate-gray">{me.data.role.charAt(0) + me.data.role.slice(1).toLowerCase()}</span>
              </span>
            )}
            <button type="button" onClick={() => setChangingPassword(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-gray hover:bg-slate-100 hover:text-primary-navy">
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Password</span>
            </button>
            <button type="button" onClick={() => signOut()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-gray hover:bg-slate-100 hover:text-primary-navy">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-xl font-bold text-primary-navy">EduGear Platform</h1>
        <p className="mt-1 text-sm text-slate-gray">Every school on EduGear. Sessions last 15 minutes, then you&apos;ll be asked to sign in again.</p>
        <div className="mt-2">
          {me.isPending ? (
            <p className="py-10 text-center text-sm text-slate-gray"><LoadingText label="Loading..." /></p>
          ) : me.isError ? (
            <p className="py-10 text-center text-sm text-slate-gray">{errorMessage(me.error)}</p>
          ) : (
            <ConsoleBody me={me.data} />
          )}
        </div>
      </main>
      {changingPassword && (
        // The backend has already revoked this session, so drop its cookie and sign in with the new password.
        <PlatformPasswordModal onClose={() => setChangingPassword(false)} onChanged={() => signOut("/platform/login?changed=1")} />
      )}
    </div>
  );
}
