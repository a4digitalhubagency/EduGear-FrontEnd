"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingText, RetryButton } from "@/components/ui/table";
import { ArmOptions } from "@/components/students/ArmOptions";
import { PhotoPicker } from "@/components/students/PhotoPicker";
import { displayName } from "@/components/students/StudentProfileHeader";
import { ApiError, errorMessage } from "@/lib/api-client";
import { NIGERIAN_STATES } from "@/lib/nigerian-states";
import { useFileUrl } from "@/lib/queries/files";
import { useRemoveStudentPhoto, useStudent, useUpdateStudent, useUploadStudentPhoto } from "@/lib/queries/students";
import { GENDER_LABELS } from "@/lib/student-labels";
import { toDateInput, todayInput } from "@/lib/utils";
import { BLOOD_GROUP_OPTIONS, GENOTYPE_OPTIONS, editStudentSchema, type EditStudentValues } from "@/lib/validation/student";
import { GENDERS, type StudentProfile, type UpdateStudentInput } from "@/types/students";

function toFormValues(s: StudentProfile): EditStudentValues {
  return {
    firstName: s.firstName,
    lastName: s.lastName,
    middleName: s.middleName ?? "",
    gender: s.gender,
    dateOfBirth: s.dateOfBirth ? toDateInput(s.dateOfBirth) : "",
    nationality: s.nationality,
    stateOfOrigin: s.stateOfOrigin ?? "",
    lga: s.lga ?? "",
    religion: s.religion ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    addressLine: s.addressLine ?? "",
    bloodGroup: s.bloodGroup ?? "",
    genotype: s.genotype ?? "",
    classArmId: s.classArmId ?? "",
    admissionDate: toDateInput(s.admissionDate),
    notes: s.notes ?? "",
  };
}

/** Fields UpdateStudentDto lets you clear by sending null. */
const NULLABLE = new Set<keyof EditStudentValues>([
  "middleName", "dateOfBirth", "email", "phone", "addressLine", "bloodGroup", "genotype",
  "stateOfOrigin", "lga", "religion", "notes", "classArmId",
]);

/** Photo is saved straight away (its own endpoint), independent of the form's Save. */
function PhotoEditor({ student }: { student: StudentProfile }) {
  const current = useFileUrl(student.photoUrl);
  const upload = useUploadStudentPhoto();
  const remove = useRemoveStudentPhoto();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      <PhotoPicker
        currentUrl={current}
        label="Change Photo"
        busy={upload.isPending || remove.isPending}
        onChange={(file) => {
          if (!file) return;
          setError(null);
          upload.mutate({ id: student.id, file }, { onError: (err) => setError(errorMessage(err)) });
        }}
      />
      {student.photoUrl && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            remove.mutate(student.id, { onError: (err) => setError(errorMessage(err)) });
          }}
          disabled={remove.isPending}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove photo
        </button>
      )}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

/**
 * "Edit Student - Pre-populated Form (Desktop)", on PATCH /students/:id. Sends only what
 * changed; clearing an optional field sends null, which the backend accepts. The admission
 * number can't change, status has its own action on the profile, and guardians are
 * managed on the profile's Guardians tab, so neither is edited here.
 */
export function EditStudentForm({ student }: { student: StudentProfile }) {
  const router = useRouter();
  const update = useUpdateStudent();
  const [serverError, setServerError] = useState<string | null>(null);
  const name = displayName(student);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<EditStudentValues>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: toFormValues(student),
  });

  async function onSubmit(values: EditStudentValues) {
    setServerError(null);
    const input: Record<string, unknown> = {};
    for (const key of Object.keys(dirtyFields) as (keyof EditStudentValues)[]) {
      const value = values[key];
      if (value === "") {
        if (NULLABLE.has(key)) input[key] = null; // cleared
        // nationality can't be null; leaving it empty keeps the saved value
      } else {
        input[key] = value;
      }
    }
    try {
      await update.mutateAsync({ id: student.id, input: input as UpdateStudentInput });
      router.push(`/students/${student.id}`);
    } catch (err) {
      setServerError(errorMessage(err));
    }
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
            <Link href={`/students/${student.id}`} className="hover:text-primary-navy hover:underline">
              {name}
            </Link>{" "}
            / <span className="text-primary-navy">Edit</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary-navy">Edit Student: {name}</h1>
          <p className="mt-1 text-sm text-slate-gray">
            Admission no. {student.studentId}. Guardians are managed on the profile&apos;s Guardians tab.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/students/${student.id}`}>
            <Button type="button" variant="secondary" className="w-auto px-4 py-2.5">
              Cancel
            </Button>
          </Link>
          <Button type="submit" form="edit-student-form" isLoading={isSubmitting} disabled={!isDirty} className="w-auto px-4 py-2.5">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {serverError && (
        <div className="mt-4">
          <FormError message={serverError} />
        </div>
      )}

      <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Personal Information</h2>
            <div className="mt-4 flex justify-center">
              <PhotoEditor student={student} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="First Name *" error={errors.firstName?.message} {...register("firstName")} />
              <Input label="Last Name *" error={errors.lastName?.message} {...register("lastName")} />
              <Input label="Middle Name" error={errors.middleName?.message} {...register("middleName")} />
              <Input label="Date of Birth *" type="date" max={todayInput()} error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
              <SelectField label="Gender *" error={errors.gender?.message} {...register("gender")}>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </option>
                ))}
              </SelectField>
              <Input label="Nationality" error={errors.nationality?.message} {...register("nationality")} />
              <SelectField label="State of Origin *" error={errors.stateOfOrigin?.message} {...register("stateOfOrigin")}>
                <option value="" disabled>
                  Select State
                </option>
                {NIGERIAN_STATES.map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </SelectField>
              <Input label="LGA" error={errors.lga?.message} {...register("lga")} />
              <Input label="Religion" error={errors.religion?.message} {...register("religion")} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Contact</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Student Phone" error={errors.phone?.message} {...register("phone")} />
              <Input label="Student Email" type="email" error={errors.email?.message} {...register("email")} />
              <div className="sm:col-span-2">
                <Textarea label="Address" rows={2} error={errors.addressLine?.message} {...register("addressLine")} />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Enrollment</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Class/Arm" error={errors.classArmId?.message} {...register("classArmId")}>
                <ArmOptions emptyLabel="Not placed (remove from class)" />
              </SelectField>
              <Input label="Admission Date *" type="date" error={errors.admissionDate?.message} {...register("admissionDate")} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Medical & Notes</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Blood Group" {...register("bloodGroup")}>
                <option value="">Unknown</option>
                {BLOOD_GROUP_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </SelectField>
              <SelectField label="Genotype" {...register("genotype")}>
                <option value="">Unknown</option>
                {GENOTYPE_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </SelectField>
              <div className="sm:col-span-2">
                <Textarea
                  label="Notes"
                  rows={5}
                  placeholder="Allergies, conditions, emergency contact, anything staff should know"
                  error={errors.notes?.message}
                  {...register("notes")}
                />
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}

/** Loads the student for the edit page (the session token lives in memory, so this runs in the browser). */
export function EditStudentView({ id }: { id: string }) {
  const student = useStudent(id);

  if (student.isPending) {
    return (
      <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-12 text-center text-sm text-slate-gray">
        <LoadingText label="Loading student..." />
      </div>
    );
  }
  if (student.isError) {
    const notFound = student.error instanceof ApiError && student.error.status === 404;
    return (
      <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-12 text-center text-sm text-slate-gray">
        {notFound ? "This student record doesn't exist or was deleted." : errorMessage(student.error)}
        {!notFound && <RetryButton onRetry={() => student.refetch()} />}
      </div>
    );
  }
  // key: start a fresh form if a refetch brings a different version of the record.
  return <EditStudentForm key={student.data.updatedAt} student={student.data} />;
}
