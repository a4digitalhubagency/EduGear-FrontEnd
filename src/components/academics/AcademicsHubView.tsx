import Link from "next/link";
import { ArrowRight, ArrowUpCircle, BarChart3, ClipboardCheck, PencilLine, type LucideIcon } from "lucide-react";

interface AcademicsModule {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string | null;
}

const ACADEMICS_MODULES: AcademicsModule[] = [
  {
    title: "Attendance Register",
    description: "Mark and manage daily class attendance, arm by arm.",
    icon: ClipboardCheck,
    href: "/academics/attendance",
  },
  {
    title: "Attendance Reports",
    description: "Track attendance trends and see which classes need attention.",
    icon: BarChart3,
    href: "/academics/attendance-reports",
  },
  {
    title: "Student Promotion",
    description: "Promote students to their next class at the end of a session.",
    icon: ArrowUpCircle,
    href: "/academics/promotion",
  },
  {
    title: "Gradebook & Results",
    description: "Score entry, computation, grading, and report cards.",
    icon: PencilLine,
    href: null,
  },
];

/**
 * "Academics" landing page — there's no Stitch screen for this hub (the
 * sidebar's "Academics" link has pointed at a 404 since the flat nav was
 * first built), so this is put together directly from the Academics
 * screens that already exist, following the same "build what's left
 * ourselves once the Stitch pass concludes" plan already agreed for gaps
 * like this. Each card links to a real screen except "Gradebook &
 * Results," which has no design or build yet and renders as a disabled
 * "Coming Soon" tile instead of a link, same treatment as other
 * undesigned areas elsewhere (e.g. the Student Profile's own unbuilt tabs).
 */
export function AcademicsHubView() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-primary-navy">Academics</h1>
        <p className="mt-1 text-sm text-slate-gray">
          Manage attendance, promotions, and academic records for your school.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACADEMICS_MODULES.map((module) => {
          const Icon = module.icon;
          const content = (
            <>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
                  <Icon className="h-5 w-5" />
                </div>
                {module.href ? (
                  <ArrowRight className="h-4 w-4 text-slate-gray/40" />
                ) : (
                  <span className="rounded-full bg-slate-gray/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm font-bold text-primary-navy">{module.title}</p>
              <p className="mt-1 text-xs text-slate-gray">{module.description}</p>
            </>
          );

          return module.href ? (
            <Link
              key={module.title}
              href={module.href}
              className="rounded-xl border border-slate-gray/10 bg-white p-5 transition-colors hover:border-bright-blue/30 hover:bg-cloud-sky/10"
            >
              {content}
            </Link>
          ) : (
            <div key={module.title} className="rounded-xl border border-slate-gray/10 bg-white p-5 opacity-60">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}