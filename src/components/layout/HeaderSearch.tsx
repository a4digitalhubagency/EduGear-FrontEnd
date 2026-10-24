"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { api, toQueryString } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks";
import { DEFAULT_SEARCH_PLACEHOLDER, SEARCH_PLACEHOLDERS } from "@/lib/nav";
import { useCan } from "@/lib/store/auth-store";
import { getInitials } from "@/lib/utils";
import type { Paginated } from "@/types/api";
import type { Student } from "@/types/students";
import type { StaffMember } from "@/types/users";

const MIN_CHARS = 2;
const PER_GROUP = 5;

/**
 * Header search across students and staff. The backend has no global search endpoint,
 * so this queries the two lists that support `search` (students: name or admission number;
 * staff: name or email), each only for users allowed to read it.
 */
export function HeaderSearch() {
  const pathname = usePathname();
  const placeholder = SEARCH_PLACEHOLDERS[pathname] ?? DEFAULT_SEARCH_PLACEHOLDER;
  const canReadStudents = useCan("students.read");
  const canReadStaff = useCan("users.read");

  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const query = useDebouncedValue(term.trim());
  const ready = query.length >= MIN_CHARS;

  const students = useQuery({
    queryKey: ["students", "header-search", query],
    queryFn: () =>
      api<Paginated<Student>>(`/students${toQueryString({ search: query, status: "ALL", limit: PER_GROUP, sortBy: "lastName", sortOrder: "asc" })}`),
    enabled: ready && canReadStudents,
  });
  const staff = useQuery({
    queryKey: ["users", "header-search", query],
    queryFn: () => api<Paginated<StaffMember>>(`/users${toQueryString({ search: query, limit: PER_GROUP, sortBy: "lastName", sortOrder: "asc" })}`),
    enabled: ready && canReadStaff,
  });

  const loading = (students.fetchStatus === "fetching") || (staff.fetchStatus === "fetching");
  const studentRows = canReadStudents ? (students.data?.data ?? []) : [];
  const staffRows = canReadStaff ? (staff.data?.data ?? []) : [];
  const close = () => {
    setOpen(false);
    setTerm("");
  };

  return (
    <div
      className="relative max-w-md flex-1"
      onBlur={(e) => {
        // Keep it open while focus moves to a result inside it.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-gray/50" />
      <input
        type="search"
        placeholder={placeholder}
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && close()}
        aria-label="Search students and staff"
        className="w-full rounded-lg border border-slate-gray/25 bg-white py-2 pl-9 pr-3 text-sm text-primary-navy placeholder:text-slate-gray/50 focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20"
      />

      {open && term.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 origin-top animate-dropdown-in overflow-y-auto rounded-xl border border-slate-gray/10 bg-white p-2 shadow-xl">
          {!ready ? (
            <p className="px-3 py-2 text-xs text-slate-gray">Type at least {MIN_CHARS} characters.</p>
          ) : loading && studentRows.length === 0 && staffRows.length === 0 ? (
            <p className="inline-flex items-center gap-2 px-3 py-2 text-xs text-slate-gray">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching...
            </p>
          ) : studentRows.length === 0 && staffRows.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-gray">No students or staff match &quot;{query}&quot;.</p>
          ) : (
            <>
              {studentRows.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Students</p>
                  {studentRows.map((s) => (
                    <Link
                      key={s.id}
                      href={`/students/${s.id}`}
                      onClick={close}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-cloud-sky/40"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {getInitials(`${s.firstName} ${s.lastName}`)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary-navy">{s.fullName}</p>
                        <p className="truncate text-xs text-slate-gray">
                          {s.studentId}
                          {s.className ? ` · ${s.className}` : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {staffRows.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">Staff</p>
                  {staffRows.map((m) => (
                    <Link
                      key={m.membershipId}
                      href="/personnel"
                      onClick={close}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-cloud-sky/40"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cloud-sky text-xs font-semibold text-bright-blue">
                        {getInitials(`${m.firstName} ${m.lastName}`)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary-navy">
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-gray">
                          {m.roleName} · {m.email}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
