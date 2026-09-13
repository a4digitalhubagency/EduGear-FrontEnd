"use client";

import { useState } from "react";
import { GraduationCap, ShieldUser, UserRound } from "lucide-react";
import { InfoCard } from "@/components/students/InfoCard";
import { AttendanceSummaryCard } from "@/components/students/AttendanceSummaryCard";
import { FinanceOverviewCard } from "@/components/students/FinanceOverviewCard";
import { AcademicPerformanceCard } from "@/components/students/AcademicPerformanceCard";
import { StudentRecentActivityCard } from "@/components/students/StudentRecentActivityCard";
import { StudentProfileHeader, PROFILE_TABS, type ProfileTab } from "@/components/students/StudentProfileHeader";
import { STATUS_LABELS } from "@/components/students/StatusBadge";
import type { StudentProfile } from "@/types/student";

/**
 * "Student Profile - Overview (Desktop)" screen. Only the Overview tab is
 * designed in Stitch so far — the other 4 tabs render a simple "not
 * available yet" placeholder rather than invented content.
 */
export function StudentProfileView({ student }: { student: StudentProfile }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(PROFILE_TABS[0]);

  return (
    <div>
      <StudentProfileHeader student={student} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "Overview" ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <InfoCard
              icon={UserRound}
              title="Personal Information"
              rows={[
                { label: "Date of Birth", value: student.dateOfBirth },
                { label: "Gender", value: student.gender },
                { label: "Student ID", value: student.studentId },
                { label: "Admission Date", value: student.admissionDate },
              ]}
            />
            <InfoCard
              icon={GraduationCap}
              title="Enrollment"
              rows={[
                { label: "Current Class", value: student.className },
                { label: "Academic Session", value: student.academicSession },
                { label: "Status", value: STATUS_LABELS[student.status] },
              ]}
            />
            <InfoCard
              icon={ShieldUser}
              title="Guardian Details"
              rows={[
                { label: "Name", value: student.guardianName },
                { label: "Relationship", value: student.guardianRelationship },
                { label: "Phone", value: student.phone },
                { label: "Email", value: student.guardianEmail },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <AttendanceSummaryCard attendance={student.attendance} />
            <FinanceOverviewCard finance={student.finance} />
            <AcademicPerformanceCard performance={student.academicPerformance} />
          </div>

          <StudentRecentActivityCard activity={student.recentActivity} />
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-gray/20 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-primary-navy">{activeTab} — coming soon</p>
          <p className="mt-1 text-xs text-slate-gray">
            This tab hasn&apos;t been designed in Stitch yet, so there&apos;s nothing to build
            here for now.
          </p>
        </div>
      )}
    </div>
  );
}