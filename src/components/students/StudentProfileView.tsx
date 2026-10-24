"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, ShieldUser, UserRound } from "lucide-react";
import { TERM_LABELS } from "@/components/academics/setup/shared";
import { InfoCard } from "@/components/students/InfoCard";
import { GuardianInformationCard } from "@/components/students/GuardianInformationCard";
import { AttendanceSummaryCard } from "@/components/students/AttendanceSummaryCard";
import { FinanceOverviewCard } from "@/components/students/FinanceOverviewCard";
import { AcademicPerformanceCard } from "@/components/students/AcademicPerformanceCard";
import { StudentRecentActivityCard } from "@/components/students/StudentRecentActivityCard";
import { StudentAttendanceTab, StudentFinanceTab, StudentResultsTab } from "@/components/students/StudentRecordTabs";
import { StudentProfileHeader, PROFILE_TABS, displayName, type ProfileTab } from "@/components/students/StudentProfileHeader";
import { LoadingText, RetryButton } from "@/components/ui/table";
import { ApiError, errorMessage } from "@/lib/api-client";
import { useCurrentTerm } from "@/lib/queries/academics";
import { useStudent } from "@/lib/queries/students";
import { useCan } from "@/lib/store/auth-store";
import { GENDER_LABELS, RELATIONSHIP_LABELS, STUDENT_STATUS_LABELS } from "@/lib/student-labels";
import { formatDate } from "@/lib/utils";

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-12 text-center text-sm text-slate-gray">{children}</div>
  );
}

/**
 * "Student Profile - Overview (Desktop)" plus the Guardians tab, on GET /students/:id.
 * The Overview's attendance, finance and academic cards read the current term from
 * their own modules; the Attendance, Finance and Results tabs show the full records.
 */
export function StudentProfileView({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(PROFILE_TABS[0]);
  const student = useStudent(id);
  const term = useCurrentTerm(useCan("academics.read"));
  const termId = term.data?.id;
  const termLabel = term.data ? TERM_LABELS[term.data.name] : undefined;

  if (student.isPending) {
    return (
      <StateCard>
        <LoadingText label="Loading student..." />
      </StateCard>
    );
  }
  if (student.isError) {
    const notFound = student.error instanceof ApiError && student.error.status === 404;
    return (
      <StateCard>
        {notFound ? (
          <>
            This student record doesn&apos;t exist or was deleted.{" "}
            <Link href="/students" className="font-semibold text-bright-blue hover:underline">
              Back to Students
            </Link>
          </>
        ) : (
          <>
            {errorMessage(student.error)}
            <RetryButton onRetry={() => student.refetch()} />
          </>
        )}
      </StateCard>
    );
  }

  const s = student.data;
  const primary = s.guardians.find((g) => g.isPrimary) ?? s.guardians[0];

  return (
    <div>
      <p className="mb-3 text-sm text-slate-gray">
        <Link href="/students" className="hover:text-primary-navy hover:underline">
          Students
        </Link>{" "}
        / <span className="text-primary-navy">{displayName(s)}</span>
      </p>
      <StudentProfileHeader student={s} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "Overview" ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <InfoCard
              icon={UserRound}
              title="Personal Information"
              rows={[
                { label: "Date of Birth", value: s.dateOfBirth ? formatDate(s.dateOfBirth) : "—" },
                { label: "Gender", value: GENDER_LABELS[s.gender] },
                { label: "State of Origin", value: [s.lga, s.stateOfOrigin].filter(Boolean).join(", ") || "—" },
                { label: "Blood Group / Genotype", value: [s.bloodGroup, s.genotype].filter(Boolean).join(" / ") || "—" },
              ]}
            />
            <InfoCard
              icon={GraduationCap}
              title="Enrollment"
              rows={[
                { label: "Admission No.", value: s.studentId },
                { label: "Current Class", value: s.className ?? "Not assigned" },
                { label: "Admission Date", value: formatDate(s.admissionDate) },
                { label: "Status", value: STUDENT_STATUS_LABELS[s.status] },
              ]}
            />
            <InfoCard
              icon={ShieldUser}
              title="Guardian Details"
              rows={
                primary
                  ? [
                      { label: "Name", value: primary.fullName },
                      { label: "Relationship", value: RELATIONSHIP_LABELS[primary.relationship] },
                      { label: "Phone", value: primary.phone },
                      { label: "Email", value: primary.email ?? "—" },
                    ]
                  : [{ label: "Guardian", value: "None on file yet" }]
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <AttendanceSummaryCard studentId={s.id} termId={termId} termLabel={termLabel} />
            <FinanceOverviewCard studentId={s.id} />
            <AcademicPerformanceCard studentId={s.id} termId={termId} termLabel={termLabel} />
          </div>

          {s.notes && (
            <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
              <h2 className="text-sm font-bold text-primary-navy">Notes</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-gray">{s.notes}</p>
            </div>
          )}

          <StudentRecentActivityCard studentId={s.id} />
        </div>
      ) : activeTab === "Guardians" ? (
        <div className="mt-4">
          <GuardianInformationCard studentId={s.id} studentName={displayName(s)} guardians={s.guardians} />
        </div>
      ) : activeTab === "Attendance" ? (
        <StudentAttendanceTab studentId={s.id} />
      ) : activeTab === "Finance" ? (
        <StudentFinanceTab studentId={s.id} />
      ) : (
        <StudentResultsTab studentId={s.id} />
      )}
    </div>
  );
}
