"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, GraduationCap, Hash, RefreshCw, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Popover } from "@/components/ui/Popover";
import { Tabs } from "@/components/ui/table";
import { ChangeStatusModal } from "@/components/students/ChangeStatusModal";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { STUDENT_STATUS_DOT_COLORS } from "@/components/students/StatusBadge";
import { useDeleteStudent } from "@/lib/queries/students";
import { useCan } from "@/lib/store/auth-store";
import { STUDENT_STATUS_LABELS } from "@/lib/student-labels";
import type { StudentProfile } from "@/types/students";

export const PROFILE_TABS = ["Overview", "Guardians", "Attendance", "Finance", "Results"] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

/** "Ada Nkem Obi": the profile reads names in speaking order, unlike the list's "Obi, Ada N.". */
export function displayName(student: Pick<StudentProfile, "firstName" | "middleName" | "lastName">) {
  return [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
}

interface StudentProfileHeaderProps {
  student: StudentProfile;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

/**
 * Student Profile header: photo (or initials), name + status dot, "# admission number
 * · class", More Actions (Change Status, Delete) and Edit Student, then the tab strip.
 * The design's Academics tab is gone (no academic-history endpoint); Attendance,
 * Finance and Results are real now instead of "coming soon".
 */
export function StudentProfileHeader({ student, activeTab, onTabChange }: StudentProfileHeaderProps) {
  const router = useRouter();
  const canUpdate = useCan("students.update");
  const canDelete = useCan("students.delete");
  const remove = useDeleteStudent();
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const name = displayName(student);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StudentAvatar id={student.id} name={`${student.firstName} ${student.lastName}`} photoUrl={student.photoUrl} className="h-14 w-14 text-lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-primary-navy">{name}</h1>
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-gray">
                <span className={`h-2 w-2 rounded-full ${STUDENT_STATUS_DOT_COLORS[student.status]}`} />
                {STUDENT_STATUS_LABELS[student.status]}
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
                {student.className ?? "No class assigned"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {(canUpdate || canDelete) && (
            <Popover
              className="w-56 py-2"
              trigger={({ open, toggle }) => (
                <Button type="button" variant="secondary" className="w-auto px-4 py-2.5" onClick={toggle} aria-expanded={open}>
                  More Actions
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
            >
              {(close) => (
                <div>
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        setChangingStatus(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-primary-navy hover:bg-cloud-sky/40"
                    >
                      <RefreshCw className="h-4 w-4 text-slate-gray" />
                      Change Status
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        setDeleting(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Student
                    </button>
                  )}
                </div>
              )}
            </Popover>
          )}
          {canUpdate && (
            <Link href={`/students/${student.id}/edit`}>
              <Button type="button" className="w-auto px-4 py-2.5">
                <SquarePen className="h-4 w-4" />
                Edit Student
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs tabs={PROFILE_TABS} active={activeTab} onChange={onTabChange} />

      {changingStatus && <ChangeStatusModal student={student} onClose={() => setChangingStatus(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete Student Record?"
          description={
            <>
              This permanently deletes <span className="font-semibold text-primary-navy">{name}</span> and can&apos;t be
              undone. If they&apos;ve left the school, use <span className="font-semibold">Change Status</span> instead
              (e.g. Withdrawn or Transferred) so their records survive for reporting.
            </>
          }
          confirmLabel="Delete Permanently"
          onConfirm={async () => {
            await remove.mutateAsync(student.id);
            router.replace("/students");
          }}
          onClose={() => setDeleting(false)}
        />
      )}
    </div>
  );
}
