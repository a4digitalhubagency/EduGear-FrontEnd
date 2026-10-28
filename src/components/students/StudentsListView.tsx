"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Loader2, Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { StudentStatusBadge } from "@/components/students/StatusBadge";
import { api, errorMessage, toQueryString } from "@/lib/api-client";
import { csvDate, downloadCsv } from "@/lib/csv";
import { useDebouncedValue } from "@/lib/hooks";
import { useClassArms, useClasses } from "@/lib/queries/academics";
import { useStudents } from "@/lib/queries/students";
import { useCan } from "@/lib/store/auth-store";
import { GENDER_LABELS, STUDENT_STATUS_LABELS } from "@/lib/student-labels";
import { cn, formatDate } from "@/lib/utils";
import type { Paginated } from "@/types/api";
import { GENDERS, STUDENT_STATUSES, type Gender, type Student, type StudentStatus, type StudentsQuery } from "@/types/students";

const PAGE_SIZE = 20;
const COLUMNS = 8;

/**
 * The class filter is one dropdown, as in the design ("SS 2A"), but it can mean a
 * whole class, one arm, or no arm at all, so the value carries its kind:
 * "" (all), "class:<id>", "arm:<id>" or "unassigned".
 */
function placementQuery(value: string): Pick<StudentsQuery, "classId" | "classArmId" | "unassigned"> {
  if (value.startsWith("class:")) return { classId: value.slice("class:".length) };
  if (value.startsWith("arm:")) return { classArmId: value.slice("arm:".length) };
  if (value === "unassigned") return { unassigned: true };
  return {};
}

/** Up to five page numbers centred on the current page. */
function pageWindow(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
}

/**
 * "Students - List View (Desktop)" screen, on the real API: search, filters and
 * pagination all happen server-side (GET /students). Differences from the design,
 * agreed with the frontend lead:
 * - Guardian and Phone columns became Admission Date and the student's own phone,
 *   because the list endpoint carries no guardian data (it's on the profile).
 * - The Session filter is gone: students aren't tied to a session in the backend.
 * - Statuses are the backend's five (no Pending / On Leave).
 * Export downloads every student matching the current filters as CSV, built in the browser
 * (the backend has no export endpoint), with dates as DD/MM/YYYY like the import expects.
 */
export function StudentsListView() {
  const canCreate = useCan("students.create");
  const classes = useClasses();
  const arms = useClassArms();

  const [search, setSearch] = useState("");
  const [placement, setPlacement] = useState("");
  // Defaults to Active, the backend's own default: graduated/withdrawn students rarely belong in the day-to-day list.
  const [status, setStatus] = useState<StudentStatus | "ALL">("ACTIVE");
  const [gender, setGender] = useState<Gender | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const filters = {
    search: debouncedSearch.trim() || undefined,
    status,
    gender: gender || undefined,
    ...placementQuery(placement),
    sortBy: "lastName",
    sortOrder: "asc", // the backend defaults to desc, which reads backwards for names
  } satisfies Omit<StudentsQuery, "page" | "limit">;
  const students = useStudents({ page, limit: PAGE_SIZE, ...filters });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function exportStudents() {
    setExporting(true);
    setExportError(null);
    try {
      const all: Student[] = [];
      // The list endpoint pages at most 100 at a time.
      for (let p = 1; ; p++) {
        const res = await api<Paginated<Student>>(`/students${toQueryString({ ...filters, page: p, limit: 100 })}`);
        all.push(...res.data);
        if (!res.meta.hasNextPage) break;
      }
      downloadCsv(
        `students-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Admission No", "Last Name", "First Name", "Middle Name", "Gender", "Date of Birth", "Class", "Status", "Admission Date", "Phone", "Email", "State of Origin"],
        all.map((s) => [
          s.studentId, s.lastName, s.firstName, s.middleName, GENDER_LABELS[s.gender], csvDate(s.dateOfBirth), s.className ?? "Not placed",
          STUDENT_STATUS_LABELS[s.status], csvDate(s.admissionDate), s.phone, s.email, s.stateOfOrigin,
        ]),
      );
    } catch (err) {
      setExportError(errorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  // Every filter change starts again from page 1, or you could land past the last page.
  function changeFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const rows = students.data?.data ?? [];
  const meta = students.data?.meta;
  const armList = arms.data?.data ?? [];
  const firstShown = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const lastShown = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Students</h1>
          <p className="mt-1 text-sm text-slate-gray">
            Manage student records, enrollment, and academic information.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="w-auto px-4 py-2.5" onClick={exportStudents} isLoading={exporting} disabled={!meta?.total}>
            {!exporting && <Download className="h-4 w-4" />}
            {exporting ? "Exporting..." : "Export"}
          </Button>
          {canCreate && (
            <>
              <Link href="/students/import">
                <Button type="button" variant="ghost" className="w-auto px-4 py-2.5">
                  <Upload className="h-4 w-4" />
                  Import Students
                </Button>
              </Link>
              <Link href="/students/new">
                <Button type="button" className="w-auto px-4 py-2.5">
                  <Plus className="h-4 w-4" />
                  Add Student
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {exportError && <p className="mt-3 text-sm text-red-600">Couldn&apos;t export: {exportError}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            icon={Search}
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => changeFilter(setSearch)(e.target.value)}
            className="py-2.5"
            aria-label="Search students"
          />
        </div>
        <Select value={placement} onChange={(e) => changeFilter(setPlacement)(e.target.value)} aria-label="Filter by class">
          <option value="">All Classes</option>
          {(classes.data?.data ?? []).map((schoolClass) => (
            <optgroup key={schoolClass.id} label={schoolClass.name}>
              <option value={`class:${schoolClass.id}`}>All {schoolClass.name}</option>
              {armList
                .filter((arm) => arm.classId === schoolClass.id)
                .map((arm) => (
                  <option key={arm.id} value={`arm:${arm.id}`}>
                    {arm.fullName}
                  </option>
                ))}
            </optgroup>
          ))}
          <option value="unassigned">No class assigned</option>
        </Select>
        <Select
          value={status}
          onChange={(e) => changeFilter(setStatus)(e.target.value as StudentStatus | "ALL")}
          aria-label="Filter by status"
        >
          <option value="ALL">All Status</option>
          {STUDENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STUDENT_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
        <Select
          value={gender}
          onChange={(e) => changeFilter(setGender)(e.target.value as Gender | "")}
          aria-label="Filter by gender"
        >
          <option value="">Gender</option>
          {GENDERS.map((value) => (
            <option key={value} value={value}>
              {GENDER_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
        <table
          className={cn(
            "w-full min-w-[860px] text-left text-sm transition-opacity",
            // The previous page stays on screen while the next one loads; dim it so that's visible.
            students.isPlaceholderData && "opacity-60",
          )}
        >
          <thead>
            <tr className="border-b border-slate-gray/10 text-xs font-semibold uppercase tracking-wide text-slate-gray">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all students"
                  className="h-4 w-4 rounded border-slate-gray/40"
                />
              </th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Admission Date</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.isPending ? (
              <tr>
                <td colSpan={COLUMNS} className="px-4 py-10 text-center text-sm text-slate-gray">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading students...
                  </span>
                </td>
              </tr>
            ) : students.isError ? (
              <tr>
                <td colSpan={COLUMNS} className="px-4 py-10 text-center text-sm text-slate-gray">
                  {errorMessage(students.error)}
                  <button
                    type="button"
                    onClick={() => students.refetch()}
                    className="ml-1 font-semibold text-bright-blue hover:underline"
                  >
                    Try again
                  </button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS} className="px-4 py-10 text-center text-sm text-slate-gray">
                  No students match your filters.
                </td>
              </tr>
            ) : (
              rows.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-gray/10 last:border-0 hover:bg-cloud-sky/20"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${student.fullName}`}
                      className="h-4 w-4 rounded border-slate-gray/40"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/students/${student.id}`} className="flex items-center gap-3">
                      <StudentAvatar
                        id={student.id}
                        name={`${student.firstName} ${student.lastName}`}
                        photoUrl={student.photoUrl}
                      />
                      <div>
                        <p className="font-semibold text-primary-navy hover:underline">{student.fullName}</p>
                        {student.email && <p className="text-xs text-slate-gray">{student.email}</p>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-gray">{student.studentId}</td>
                  <td className="px-4 py-3 text-slate-gray">{student.className ?? "Unassigned"}</td>
                  <td className="px-4 py-3 text-slate-gray">{GENDER_LABELS[student.gender]}</td>
                  <td className="px-4 py-3 text-slate-gray">{formatDate(student.admissionDate)}</td>
                  <td className="px-4 py-3 text-slate-gray">{student.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StudentStatusBadge status={student.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-gray/10 px-4 py-3 text-sm text-slate-gray">
          <p>
            {meta ? `Showing ${firstShown}–${lastShown} of ${meta.total.toLocaleString()} students` : " "}
          </p>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={!meta.hasPreviousPage}
                className="rounded-md px-2.5 py-1.5 hover:bg-cloud-sky/60 disabled:cursor-not-allowed disabled:text-slate-gray/40 disabled:hover:bg-transparent"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageWindow(meta.page, meta.totalPages).map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setPage(number)}
                  aria-current={number === meta.page ? "page" : undefined}
                  className={
                    number === meta.page
                      ? "rounded-md bg-primary-navy px-3 py-1.5 font-semibold text-white"
                      : "rounded-md px-3 py-1.5 hover:bg-cloud-sky/60"
                  }
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={!meta.hasNextPage}
                className="rounded-md px-2.5 py-1.5 hover:bg-cloud-sky/60 disabled:cursor-not-allowed disabled:text-slate-gray/40 disabled:hover:bg-transparent"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
