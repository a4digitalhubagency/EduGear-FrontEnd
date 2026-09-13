"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SavedStudent {
  name: string;
  initials: string;
  admissionNumber: string;
  classArm: string;
}

interface AddStudentSuccessModalProps {
  student: SavedStudent;
  onAddAnother: () => void;
}

/**
 * "Student Successfully Added" confirmation, from the "Add Student -
 * Operational States" reference screen. `admissionNumber` is generated
 * client-side for now (see AddStudentForm.tsx) — the backend will own this
 * once wired up. "View Profile" falls back to the Students list until the
 * Student Profile view is built.
 */
export function AddStudentSuccessModal({ student, onAddAnother }: AddStudentSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-navy/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bright-blue text-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-lg font-bold text-primary-navy">Student Successfully Added</h2>
        <p className="mt-1.5 text-sm text-slate-gray">
          The admission record has been created and saved to the database.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-gray/10 bg-cloud-sky/30 p-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {student.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-navy">{student.name}</p>
            <p className="text-xs text-slate-gray">
              {student.admissionNumber} · {student.classArm || "Unassigned"}
            </p>
          </div>
        </div>

        <Link href="/students" className="mt-5 block">
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