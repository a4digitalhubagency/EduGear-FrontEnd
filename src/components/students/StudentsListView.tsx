"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/students/StatusBadge";
import { getInitials } from "@/lib/utils";
import type { Student } from "@/types/student";

/**
 * Mock roster — the 4 example rows shown in the "Students - List View
 * (Desktop)" Stitch screen. Email domain (@albarka.edu.ng) is inferred —
 * the screenshot's email text wasn't fully legible at the zoom level sent.
 * Real data (the design's own pagination footer says 1,248 students) arrives
 * once the backend is wired up — see the "wire everything at the end"
 * workflow decision in docs/ARCHITECTURE.md.
 */
const MOCK_STUDENTS: Student[] = [
  {
    id: "1",
    studentId: "EDU-00124",
    name: "Aisha Bello",
    email: "aisha.b@albarka.edu.ng",
    className: "SS 2A",
    gender: "Female",
    guardianName: "Musa Bello",
    phone: "+234 802 344 5566",
    status: "active",
  },
  {
    id: "2",
    studentId: "EDU-00125",
    name: "Chidi Okoro",
    email: "chidi.o@albarka.edu.ng",
    className: "SS 2B",
    gender: "Male",
    guardianName: "Ngozi Okoro",
    phone: "+234 703 111 2233",
    status: "active",
  },
  {
    id: "3",
    studentId: "EDU-00126",
    name: "Fatima Yusuf",
    email: "fatima.y@albarka.edu.ng",
    className: "JSS 3C",
    gender: "Female",
    guardianName: "Ibrahim Yusuf",
    phone: "+234 901 222 3344",
    status: "inactive",
  },
  {
    id: "4",
    studentId: "EDU-00127",
    name: "Tunde Adeyemi",
    email: "tunde.a@albarka.edu.ng",
    className: "SS 3A",
    gender: "Male",
    guardianName: "Bayo Adeyemi",
    phone: "+234 815 444 5555",
    status: "graduated",
  },
];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
];

const CLASS_OPTIONS = ["All Classes", "SS 3A", "SS 2A", "SS 2B", "JSS 3C"];
const STATUS_OPTIONS = ["All Status", "Active", "Inactive", "Graduated", "Pending", "On Leave"];
const GENDER_OPTIONS = ["Gender", "Male", "Female"];
const SESSION_OPTIONS = ["2023/2024 Session", "2024/2025 Session"];

/**
 * "Students - List View (Desktop)" screen. Search/filter row and table are
 * wired to the mock roster above (client-side only — no API calls yet, per
 * the "wire everything at the end" decision). Loading/Empty/Error states
 * from the "Students - Operational States" reference screen, plus the
 * Add/Edit Student forms, are separate screens — see docs/ARCHITECTURE.md
 * §3.4. Each row links to /students/:id (the Student Profile screen).
 */
export function StudentsListView() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState(CLASS_OPTIONS[0]);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);
  const [genderFilter, setGenderFilter] = useState(GENDER_OPTIONS[0]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return MOCK_STUDENTS.filter((student) => {
      const matchesSearch =
        query === "" ||
        student.name.toLowerCase().includes(query) ||
        student.studentId.toLowerCase().includes(query);
      const matchesClass = classFilter === CLASS_OPTIONS[0] || student.className === classFilter;
      const matchesStatus =
        statusFilter === STATUS_OPTIONS[0] ||
        student.status === statusFilter.toLowerCase().replace(" ", "_");
      const matchesGender = genderFilter === GENDER_OPTIONS[0] || student.gender === genderFilter;
      return matchesSearch && matchesClass && matchesStatus && matchesGender;
    });
  }, [search, classFilter, statusFilter, genderFilter]);

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
          <Button type="button" variant="secondary" className="w-auto px-4 py-2.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button type="button" variant="ghost" className="w-auto px-4 py-2.5">
            <Upload className="h-4 w-4" />
            Import Students
          </Button>
          <Link href="/students/new">
            <Button type="button" className="w-auto px-4 py-2.5">
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            icon={Search}
            placeholder="Search by name, student ID, admission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-2.5"
          />
        </div>
        <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          {CLASS_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          {GENDER_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
        <Select defaultValue={SESSION_OPTIONS[0]}>
          {SESSION_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
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
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-gray">
                  No students match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((student, index) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-gray/10 last:border-0 hover:bg-cloud-sky/20"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${student.name}`}
                      className="h-4 w-4 rounded border-slate-gray/40"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/students/${student.id}`} className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                      >
                        {getInitials(student.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-primary-navy hover:underline">{student.name}</p>
                        <p className="text-xs text-slate-gray">{student.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-gray">{student.studentId}</td>
                  <td className="px-4 py-3 text-slate-gray">{student.className}</td>
                  <td className="px-4 py-3 text-slate-gray">{student.gender}</td>
                  <td className="px-4 py-3 text-slate-gray">{student.guardianName}</td>
                  <td className="px-4 py-3 text-slate-gray">{student.phone}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={student.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-gray/10 px-4 py-3 text-sm text-slate-gray">
          <p>
            {filtered.length === 0
              ? "Showing 0 of 0 students"
              : `Showing 1–${filtered.length} of ${filtered.length} students`}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="rounded-md px-2.5 py-1.5 text-slate-gray/40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-md bg-primary-navy px-3 py-1.5 font-semibold text-white"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="rounded-md px-2.5 py-1.5 text-slate-gray/40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}