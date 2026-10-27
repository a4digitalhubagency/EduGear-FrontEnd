"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCog,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/table";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth-store";

const SUPPORT_EMAIL = "support@edugear.ng"; // same address as the login page's Support link

type HealthResponse = { status: "ok" | "error" | string };

const GUIDES: { title: string; description: string; icon: LucideIcon; href: string }[] = [
  {
    title: "Set up your school year",
    description: "Create the session, its terms, and your classes and arms. Everything else builds on these.",
    icon: CalendarCog,
    href: "/academics/setup",
  },
  {
    title: "Admit a student",
    description: "Register a student with their class and guardian in one form.",
    icon: UserPlus,
    href: "/students/new",
  },
  {
    title: "Invite your staff",
    description: "Give teachers, the bursar and the principal their own logins and roles.",
    icon: Users,
    href: "/personnel",
  },
  {
    title: "Track school fees",
    description: "See what's collected and outstanding, verify payments and follow up debtors.",
    icon: Wallet,
    href: "/finance",
  },
];

/**
 * Support page. No design exists, so it follows the Academics hub's card layout.
 * Deliberately only real, checkable information: the support address already used
 * on the login page, a live status check against the backend's health probe, and
 * the signed-in account (worth quoting in a support email).
 */
export function SupportView() {
  const user = useAuthStore((s) => s.user);
  const school = useAuthStore((s) => s.activeSchool);

  const health = useQuery({
    queryKey: ["health"],
    // Public endpoint: no token needed, and a 401 here wouldn't mean an expired session.
    queryFn: () => api<HealthResponse>("/health", { auth: false }),
    retry: false,
    staleTime: 0,
  });
  const healthy = health.data?.status === "ok";

  return (
    <div>
      <PageHeader title="Support" description="Get help with EduGear, or check that everything is running." />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-gray/10 bg-white p-5 lg:col-span-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
            <Mail className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-bold text-primary-navy">Contact the EduGear team</p>
          <p className="mt-1 text-sm text-slate-gray">
            Email us with what you were doing and what happened. Including your school and role (shown on the
            right) helps us find your account quickly.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Support request: ${school?.schoolName ?? "EduGear"}`)}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-navy/90"
          >
            <Mail className="h-4 w-4" />
            {SUPPORT_EMAIL}
          </a>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">System Status</p>
            {health.isPending ? (
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-gray">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </p>
            ) : healthy ? (
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                All systems operational
              </p>
            ) : (
              <div className="mt-2">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                  <XCircle className="h-4 w-4" />
                  EduGear can&apos;t be reached right now
                </p>
                <p className="mt-1 text-xs text-slate-gray">
                  Check your internet connection and try again in a few minutes.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => health.refetch()}
              disabled={health.isFetching}
              className="mt-3 text-xs font-semibold text-bright-blue hover:underline disabled:opacity-60"
            >
              Check again
            </button>
          </div>

          <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Your Account</p>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-gray">Name</dt>
                <dd className="text-right font-semibold text-primary-navy">
                  {user ? `${user.firstName} ${user.lastName}` : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-gray">Email</dt>
                <dd className="break-all text-right font-semibold text-primary-navy">{user?.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-gray">School</dt>
                <dd className="text-right font-semibold text-primary-navy">{school?.schoolName ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-gray">Role</dt>
                <dd className="text-right font-semibold text-primary-navy">{school?.roleName ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-bold text-primary-navy">Getting started</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GUIDES.map((guide) => {
          const Icon = guide.icon;
          return (
            <Link
              key={guide.title}
              href={guide.href}
              className="rounded-xl border border-slate-gray/10 bg-white p-5 transition-colors hover:border-bright-blue/30 hover:bg-cloud-sky/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-gray/40" />
              </div>
              <p className="mt-4 text-sm font-bold text-primary-navy">{guide.title}</p>
              <p className="mt-1 text-xs text-slate-gray">{guide.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-gray/10 bg-white p-5">
        <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
        <p className="text-sm text-slate-gray">
          <span className="font-semibold text-primary-navy">We will never ask for your password.</span> EduGear staff
          won&apos;t ask you to share it by email, phone or WhatsApp. If you&apos;ve forgotten it, use{" "}
          <span className="font-semibold text-primary-navy">Forgot password</span> on the sign-in page.
        </p>
      </div>
    </div>
  );
}
