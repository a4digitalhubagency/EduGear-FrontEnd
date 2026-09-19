"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getInitials } from "@/lib/utils";
import {
  ACADEMIC_SESSION_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  GENDER_OPTIONS,
  RELATIONSHIP_OPTIONS,
  STATUS_SELECT_OPTIONS,
  TERM_OPTIONS,
  editStudentSchema,
  type EditStudentValues,
} from "@/lib/validation/student";
import type { StudentProfile } from "@/types/student";

// Matches the class options used on the Students List View filters.
const CLASS_ARM_OPTIONS = ["SS 3A", "SS 2A", "SS 2B", "JSS 3C"];

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
];

/**
 * "Edit Student - Pre-populated Form (Desktop)" screen. Pre-fills every
 * field from the given StudentProfile and, on submit, simulates a save
 * (no backend yet — see the "wire everything at the end" decision in
 * docs/ARCHITECTURE.md) before redirecting back to the profile page.
 * Faceless initials avatar with an inert "Change Photo" affordance, same
 * as everywhere else in the app — no photo upload actually wired up here,
 * matching Add Student's own placeholder upload control.
 */
export function EditStudentForm({ student }: { student: StudentProfile }) {
  const router = useRouter();
  const avatarColor = AVATAR_COLORS[Number(student.id) % AVATAR_COLORS.length];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditStudentValues>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      name: student.name,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      guardianName: student.guardianName,
      guardianRelationship: student.guardianRelationship,
      phone: student.phone,
      guardianEmail: student.guardianEmail,
      status: student.status,
      academicSession: student.academicSession,
      term: student.term,
      className: student.className,
      bloodGroup: student.bloodGroup,
      knownAllergies: student.knownAllergies,
    },
  });

  async function onSubmit() {
    // TODO: wire up to the real EduGear "update student" endpoint once the backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 400));
    router.push(`/students/${student.id}`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-gray">
            <Link href="/students" className="hover:text-primary-navy hover:underline">
              Students
            </Link>{" "}
            /{" "}
            <Link
              href={`/students/${student.id}`}
              className="hover:text-primary-navy hover:underline"
            >
              {student.name}
            </Link>{" "}
            / <span className="text-primary-navy">Edit</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary-navy">
            Edit Student: {student.name}
          </h1>
          <p className="mt-1 text-sm text-slate-gray">
            Update this student&apos;s personal, guardian, and enrollment details.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/students/${student.id}`}>
            <Button type="button" variant="secondary" className="w-auto px-4 py-2.5">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="edit-student-form"
            isLoading={isSubmitting}
            className="w-auto px-4 py-2.5"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <form
        id="edit-student-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Personal Information</h2>

            <div className="mt-4 flex flex-col items-center gap-2">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full text-xl font-semibold ${avatarColor}`}
              >
                {getInitials(student.name)}
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-bright-blue hover:underline"
              >
                Change Photo
              </button>
              <span className="rounded-full bg-cloud-sky px-2.5 py-1 text-xs font-semibold text-bright-blue">
                {student.studentId}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                error={errors.name?.message}
                {...register("name")}
              />
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Date of Birth *
                </label>
                <Input
                  type="date"
                  error={errors.dateOfBirth?.message}
                  {...register("dateOfBirth")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Gender *
                </label>
                <Select className="w-full" {...register("gender")}>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
                {errors.gender && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Guardian Information</h2>

            <div className="mt-4 space-y-4">
              <Input
                label="Guardian Name *"
                error={errors.guardianName?.message}
                {...register("guardianName")}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                    Relationship *
                  </label>
                  <Select className="w-full" {...register("guardianRelationship")}>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </Select>
                  {errors.guardianRelationship && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.guardianRelationship.message}
                    </p>
                  )}
                </div>
                <Input
                  label="Phone Number *"
                  placeholder="+234"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                error={errors.guardianEmail?.message}
                {...register("guardianEmail")}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Enrollment</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Status *
                </label>
                <Select className="w-full" {...register("status")}>
                  {STATUS_SELECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {errors.status && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.status.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Academic Session *
                </label>
                <Select className="w-full" {...register("academicSession")}>
                  {ACADEMIC_SESSION_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Term *
                </label>
                <Select className="w-full" {...register("term")}>
                  {TERM_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Class/Arm *
                </label>
                <Select className="w-full" {...register("className")}>
                  {CLASS_ARM_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
                {errors.className && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.className.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Medical</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Blood Group
                </label>
                <Select className="w-full" {...register("bloodGroup")}>
                  {BLOOD_GROUP_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Known Allergies
                </label>
                <Textarea rows={2} {...register("knownAllergies")} />
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}