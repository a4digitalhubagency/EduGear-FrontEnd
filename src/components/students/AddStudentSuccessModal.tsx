"use client";

import Link from "next/link";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";

export interface SavedStudent {
  id: string;
  name: string;
  admissionNumber: string;
  className: string | null;
}

interface AddStudentSuccessModalProps {
  student: SavedStudent;
  /** Steps after admission that failed (guardian, photo): the student is saved regardless. */
  warnings: string[];
  onAddAnother: () => void;
}

/**
 * "Student Successfully Added" confirmation, from the "Add Student - Operational States"
 * reference screen. The admission number is the backend's. If the guardian or photo step
 * failed, the student still exists, so this says exactly what to finish on the profile.
 */
export function AddStudentSuccessModal({ student, warnings, onAddAnother }: AddStudentSuccessModalProps) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center bg-primary-navy/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl animate-dialog-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bright-blue text-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-lg font-bold text-primary-navy">Student Successfully Added</h2>
        <p className="mt-1.5 text-sm text-slate-gray">The admission record has been created and saved.</p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-gray/10 bg-cloud-sky/30 p-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {getInitials(student.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-navy">{student.name}</p>
            <p className="text-xs text-slate-gray">
              {student.admissionNumber} · {student.className ?? "No class yet"}
            </p>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-left text-xs text-primary-navy">
            <p className="flex items-center gap-1.5 font-semibold">
              <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />
              Finish on the profile:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <Link href={`/students/${student.id}`} className="mt-5 block">
          <Button type="button">View Profile</Button>
        </Link>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onAddAnother}>
            Add Another
          </Button>
          <Link href="/students">
            <Button type="button" variant="secondary">
              Back to Students
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
