import { ChevronDown, GraduationCap, Hash, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";
import { STATUS_DOT_COLORS, STATUS_LABELS } from "@/components/students/StatusBadge";
import type { StudentProfile } from "@/types/student";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
];

export const PROFILE_TABS = ["Overview", "Academics", "Attendance", "Finance", "Results"] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

interface StudentProfileHeaderProps {
  student: StudentProfile;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

/**
 * Student Profile header: faceless initials avatar (no photo — the Stitch
 * screen uses a real headshot, deliberately not carried over here), name +
 * status dot, "# studentId · className", More Actions / Edit Student
 * buttons, and the Overview/Academics/Attendance/Finance/Results tab strip.
 * "More Actions" and "Edit Student" are inert for now — no actions or edit
 * flow are wired up yet.
 */
export function StudentProfileHeader({ student, activeTab, onTabChange }: StudentProfileHeaderProps) {
  const avatarColor = AVATAR_COLORS[Number(student.id) % AVATAR_COLORS.length];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${avatarColor}`}
          >
            {getInitials(student.name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-primary-navy">{student.name}</h1>
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-gray">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[student.status]}`} />
                {STATUS_LABELS[student.status]}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-gray">
              <span className="flex items-center gap-0.5">
                <Hash className="h-3 w-3" />
                {student.studentId}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {student.className}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="w-auto px-4 py-2.5">
            More Actions
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button type="button" className="w-auto px-4 py-2.5">
            <SquarePen className="h-4 w-4" />
            Edit Student
          </Button>
        </div>
      </div>

      <div className="mt-5 flex gap-5 border-b border-slate-gray/10 text-sm font-semibold">
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={
              tab === activeTab
                ? "border-b-2 border-bright-blue pb-3 text-bright-blue"
                : "border-b-2 border-transparent pb-3 text-slate-gray hover:text-primary-navy"
            }
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}