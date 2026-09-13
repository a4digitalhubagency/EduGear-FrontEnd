"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AddStudentSuccessModal } from "@/components/students/AddStudentSuccessModal";
import { NIGERIAN_STATES } from "@/lib/nigerian-states";
import {
  ACADEMIC_SESSION_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  GENDER_OPTIONS,
  RELATIONSHIP_OPTIONS,
  TERM_OPTIONS,
  addStudentSchema,
  type AddStudentValues,
} from "@/lib/validation/student";

// Matches the class options used on the Students List View filters.
const CLASS_ARM_OPTIONS = ["SS 3A", "SS 2A", "SS 2B", "JSS 3C"];

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

/** Placeholder admission number in the same shape as the design's own mock ("ADM-2023-0451") — the backend will own real generation once wired up. */
function generateAdmissionNumber() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `ADM-${year}-${suffix}`;
}

interface SavedStudent {
  name: string;
  initials: string;
  admissionNumber: string;
  classArm: string;
}

/**
 * "Add Student - Form (Desktop)" screen — "New Admission" form, sectioned
 * into Personal Information, Enrollment, Medical (Optional), and
 * Parent/Guardian Information, in the same 2-column layout as the Stitch
 * screen (Personal Info + Guardian Info on the left, Enrollment + Medical on
 * the right). Client-side only for now — no backend call yet (see the "wire
 * everything at the end" decision in docs/ARCHITECTURE.md). "Save Student"
 * and "Save & Add Another" both submit the same way and land on the
 * "Student Successfully Added" confirmation from the "Add Student -
 * Operational States" reference screen — that modal's own "Add Another"
 * button is what actually resets the form, so the two header buttons are a
 * known simplification until there's a backend to distinguish them by.
 */
export function AddStudentForm() {
  const [savedStudent, setSavedStudent] = useState<SavedStudent | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      dateOfBirth: "",
      gender: "",
      nationality: "Nigeria",
      stateOfOrigin: "",
      academicSession: ACADEMIC_SESSION_OPTIONS[0],
      term: TERM_OPTIONS[0],
      classArm: "",
      admissionDate: "",
      bloodGroup: BLOOD_GROUP_OPTIONS[0],
      allergiesConditions: "",
      emergencyContactName: "",
      emergencyPhone: "",
      guardianFullName: "",
      relationship: "",
      guardianPhone: "",
      guardianEmail: "",
      residentialAddress: "",
    },
  });

  async function onSubmit(values: AddStudentValues) {
    // TODO: wire up to the real EduGear "create student" endpoint once the backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSavedStudent({
      name: `${values.firstName} ${values.lastName}`,
      initials: initials(values.firstName, values.lastName),
      admissionNumber: generateAdmissionNumber(),
      classArm: values.classArm,
    });
  }

  function handleAddAnother() {
    setSavedStudent(null);
    reset();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-gray">
            <Link href="/students" className="hover:text-primary-navy hover:underline">
              Students
            </Link>{" "}
            / <span className="text-primary-navy">Add Student</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary-navy">New Admission</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/students">
            <Button type="button" variant="secondary" className="w-auto px-4 py-2.5">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="add-student-form"
            variant="tonal"
            isLoading={isSubmitting}
            className="w-auto px-4 py-2.5"
          >
            Save & Add Another
          </Button>
          <Button
            type="submit"
            form="add-student-form"
            isLoading={isSubmitting}
            className="w-auto px-4 py-2.5"
          >
            <Save className="h-4 w-4" />
            Save Student
          </Button>
        </div>
      </div>

      <form
        id="add-student-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Personal Information</h2>

            <div className="mt-4 flex justify-center">
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-slate-gray/25 text-slate-gray hover:border-bright-blue hover:text-bright-blue">
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-medium">Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First Name *"
                placeholder="e.g. Oluwaseun"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label="Last Name *"
                placeholder="e.g. Adebayo"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
              <Input label="Middle Name" placeholder="Optional" {...register("middleName")} />
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
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Gender *
                </label>
                <Select className="w-full" defaultValue="" {...register("gender")}>
                  <option value="" disabled>
                    Select Gender
                  </option>
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
              <Input label="Nationality" {...register("nationality")} />
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  State of Origin *
                </label>
                <Select className="w-full" defaultValue="" {...register("stateOfOrigin")}>
                  <option value="" disabled>
                    Select State
                  </option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </Select>
                {errors.stateOfOrigin && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.stateOfOrigin.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Parent/Guardian Information</h2>

            <div className="mt-4 space-y-4">
              <Input
                label="Full Name *"
                placeholder="Parent/Guardian Full Name"
                error={errors.guardianFullName?.message}
                {...register("guardianFullName")}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                    Relationship *
                  </label>
                  <Select className="w-full" defaultValue="" {...register("relationship")}>
                    <option value="" disabled>
                      Select Relationship
                    </option>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </Select>
                  {errors.relationship && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.relationship.message}
                    </p>
                  )}
                </div>
                <Input
                  label="Phone Number *"
                  placeholder="+234"
                  error={errors.guardianPhone?.message}
                  {...register("guardianPhone")}
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                placeholder="parent@example.com"
                error={errors.guardianEmail?.message}
                {...register("guardianEmail")}
              />
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Residential Address *
                </label>
                <Textarea
                  placeholder="Full residential address"
                  rows={3}
                  error={errors.residentialAddress?.message}
                  {...register("residentialAddress")}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Enrollment</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Class/Arm *
                </label>
                <Select className="w-full" defaultValue="" {...register("classArm")}>
                  <option value="" disabled>
                    Select Class
                  </option>
                  {CLASS_ARM_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
                {errors.classArm && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.classArm.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Admission Date *
                </label>
                <Input
                  type="date"
                  error={errors.admissionDate?.message}
                  {...register("admissionDate")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Admission Number
                </label>
                <Input disabled placeholder="Auto-generated on save" />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Medical (Optional)</h2>

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
              <Input
                label="Emergency Contact Name"
                placeholder="If different from parent"
                {...register("emergencyContactName")}
              />
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                  Allergies/Conditions
                </label>
                <Textarea
                  placeholder="List any known allergies..."
                  rows={2}
                  {...register("allergiesConditions")}
                />
              </div>
              <Input
                label="Emergency Phone"
                placeholder="+234"
                className="sm:col-span-2"
                {...register("emergencyPhone")}
              />
            </div>
          </section>
        </div>
      </form>

      {savedStudent && (
        <AddStudentSuccessModal student={savedStudent} onAddAnother={handleAddAnother} />
      )}
    </div>
  );
}