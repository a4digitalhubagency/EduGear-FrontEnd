"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingText, Tabs } from "@/components/ui/table";
import { AddStudentSuccessModal, type SavedStudent } from "@/components/students/AddStudentSuccessModal";
import { ArmOptions } from "@/components/students/ArmOptions";
import { PhotoPicker } from "@/components/students/PhotoPicker";
import { errorMessage } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks";
import { NIGERIAN_STATES } from "@/lib/nigerian-states";
import { useCreateGuardian, useGuardianSearch, useLinkGuardian } from "@/lib/queries/guardians";
import { useAdmitStudent, useUploadStudentPhoto } from "@/lib/queries/students";
import { useCan } from "@/lib/store/auth-store";
import { GENDER_LABELS, RELATIONSHIP_LABELS } from "@/lib/student-labels";
import { cn, todayInput } from "@/lib/utils";
import {
  BLOOD_GROUP_OPTIONS,
  GENOTYPE_OPTIONS,
  addStudentSchema,
  composeAdmissionNotes,
  type AddStudentValues,
} from "@/lib/validation/student";
import { GUARDIAN_RELATIONSHIPS } from "@/types/guardians";
import { GENDERS, type AdmitStudentInput, type Gender } from "@/types/students";

const GUARDIAN_TABS = ["New guardian", "Existing guardian"] as const;

/** Drops empty strings, so optional fields the user left blank aren't sent at all. */
function filled<T extends Record<string, unknown>>(fields: T): Partial<T> {
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== "" && v !== null && v !== undefined)) as Partial<T>;
}

function defaultValues(guardianMode: AddStudentValues["guardianMode"], keep?: Partial<AddStudentValues>): AddStudentValues {
  return {
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "" as Gender, // the resolver rejects "", so this only covers the empty start
    dateOfBirth: "",
    nationality: "Nigerian",
    stateOfOrigin: "",
    lga: "",
    religion: "",
    email: "",
    phone: "",
    addressLine: "",
    bloodGroup: "",
    genotype: "",
    classArmId: keep?.classArmId ?? "",
    admissionDate: keep?.admissionDate ?? todayInput(),
    studentId: "",
    allergies: "",
    emergencyContactName: "",
    emergencyPhone: "",
    guardianMode,
    existingGuardianId: "",
    guardianFirstName: "",
    guardianLastName: "",
    relationship: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianAddress: "",
  };
}

/** Pick an existing guardian (name or phone search), e.g. an older sibling's parent. */
function ExistingGuardianPicker({ selected, onSelect, error }: { selected: string; onSelect: (id: string) => void; error?: string }) {
  const [search, setSearch] = useState("");
  const results = useGuardianSearch(useDebouncedValue(search));
  const rows = results.data?.data ?? [];

  return (
    <div>
      <Input icon={Search} label="Find Guardian *" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <ul className="mt-2 max-h-48 divide-y divide-slate-gray/10 overflow-y-auto rounded-lg border border-slate-gray/10">
        {search.trim().length < 2 ? (
          <li className="px-3 py-3 text-sm text-slate-gray">Type at least 2 characters.</li>
        ) : results.isPending ? (
          <li className="px-3 py-3 text-sm text-slate-gray">
            <LoadingText label="Searching..." />
          </li>
        ) : rows.length === 0 ? (
          <li className="px-3 py-3 text-sm text-slate-gray">No guardians match. Use &quot;New guardian&quot; instead.</li>
        ) : (
          rows.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => onSelect(g.id)}
                aria-pressed={selected === g.id}
                className={cn("w-full px-3 py-2.5 text-left hover:bg-cloud-sky/30", selected === g.id && "bg-cloud-sky/50")}
              >
                <span className="block text-sm font-semibold text-primary-navy">{g.fullName}</span>
                <span className="text-xs text-slate-gray">
                  {g.phone} · {g.wardCount} child{g.wardCount === 1 ? "" : "ren"} already linked
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

/**
 * "Add Student - Form (Desktop)": New Admission, on the real API. Saving runs in order:
 * 1. POST /students (admission; the backend generates the admission number if left blank)
 * 2. the guardian: POST /guardians then link, or link an existing one (as primary)
 * 3. POST /students/:id/photo, if a photo was picked
 * Only step 1 can stop the save. If 2 or 3 fail the student already exists, so the
 * success screen lists what to finish on the profile instead of losing the admission.
 *
 * Changes from the design, agreed with the frontend lead: Session/Term removed (the
 * backend places a student by arm and admission date); allergies and emergency contact
 * are kept in the student's notes; genotype added (a real backend field).
 */
export function AddStudentForm() {
  const canLink = useCan("guardians.update");
  const canCreateGuardian = useCan("guardians.create");
  const guardianTabs = canCreateGuardian ? GUARDIAN_TABS : ([GUARDIAN_TABS[1]] as const);
  const initialMode: AddStudentValues["guardianMode"] = !canLink ? "none" : canCreateGuardian ? "new" : "existing";

  const admit = useAdmitStudent();
  const createGuardian = useCreateGuardian();
  const linkGuardian = useLinkGuardian();
  const uploadPhoto = useUploadStudentPhoto();

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoKey, setPhotoKey] = useState(0); // remounts the picker to clear its preview
  const [saved, setSaved] = useState<{ student: SavedStudent; warnings: string[] } | null>(null);
  const [lastAdded, setLastAdded] = useState<SavedStudent | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // Which button submitted: the ref for the save logic (onSubmit is bound before the click),
  // the state only to show the spinner on the right button.
  const intent = useRef<"save" | "another">("save");
  const [pressed, setPressed] = useState<"save" | "another">("save");
  function choose(which: "save" | "another") {
    intent.current = which;
    setPressed(which);
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: defaultValues(initialMode),
  });
  // eslint-disable-next-line react-hooks/incompatible-library -- watch() drives the guardian tab state
  const guardianMode = watch("guardianMode");
  const existingGuardianId = watch("existingGuardianId");

  function startOver(keepPlacement: boolean) {
    const v = getValues();
    reset(defaultValues(initialMode, keepPlacement ? { classArmId: v.classArmId, admissionDate: v.admissionDate } : undefined));
    setPhoto(null);
    setPhotoKey((k) => k + 1);
  }

  async function onSubmit(v: AddStudentValues) {
    setServerError(null);
    setLastAdded(null);

    // 1. Admission: the only step that can stop the save.
    const input: AdmitStudentInput = {
      firstName: v.firstName,
      lastName: v.lastName,
      gender: v.gender,
      admissionDate: v.admissionDate,
      ...filled({
        middleName: v.middleName,
        dateOfBirth: v.dateOfBirth,
        nationality: v.nationality,
        stateOfOrigin: v.stateOfOrigin,
        lga: v.lga,
        religion: v.religion,
        email: v.email,
        phone: v.phone,
        addressLine: v.addressLine,
        bloodGroup: v.bloodGroup,
        genotype: v.genotype,
        classArmId: v.classArmId,
        studentId: v.studentId,
        notes: composeAdmissionNotes(v),
      }),
    };
    let student;
    try {
      student = await admit.mutateAsync(input);
    } catch (err) {
      setServerError(errorMessage(err));
      return;
    }

    // 2 and 3: the student exists now, so failures become follow-ups, not errors.
    const warnings: string[] = [];
    if (v.guardianMode !== "none" && v.relationship) {
      try {
        let guardianId = v.existingGuardianId;
        if (v.guardianMode === "new") {
          const guardian = await createGuardian.mutateAsync({
            firstName: v.guardianFirstName,
            lastName: v.guardianLastName,
            phone: v.guardianPhone,
            ...filled({ email: v.guardianEmail, addressLine: v.guardianAddress }),
          });
          guardianId = guardian.id;
        }
        await linkGuardian.mutateAsync({
          studentId: student.id,
          input: { guardianId, relationship: v.relationship, isPrimary: true },
        });
      } catch (err) {
        warnings.push(`Add the guardian from the Guardians tab (${errorMessage(err)}).`);
      }
    }
    if (photo) {
      try {
        await uploadPhoto.mutateAsync({ id: student.id, file: photo });
      } catch (err) {
        warnings.push(`Upload the photo from Edit Student (${errorMessage(err)}).`);
      }
    }

    const summary: SavedStudent = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.studentId,
      className: student.className,
    };
    if (intent.current === "another" && warnings.length === 0) {
      // Keep class and admission date: admissions usually come a class at a time.
      startOver(true);
      setLastAdded(summary);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSaved({ student: summary, warnings });
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
            isLoading={isSubmitting && pressed === "another"}
            disabled={isSubmitting}
            onClick={() => choose("another")}
            className="w-auto px-4 py-2.5"
          >
            Save & Add Another
          </Button>
          <Button
            type="submit"
            form="add-student-form"
            isLoading={isSubmitting && pressed === "save"}
            disabled={isSubmitting}
            onClick={() => choose("save")}
            className="w-auto px-4 py-2.5"
          >
            <Save className="h-4 w-4" />
            Save Student
          </Button>
        </div>
      </div>

      {lastAdded && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-primary-navy">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>
            Admitted <span className="font-semibold">{lastAdded.name}</span> ({lastAdded.admissionNumber}). Ready for the next
            student.
          </span>
          <Link href={`/students/${lastAdded.id}`} className="font-semibold text-bright-blue hover:underline">
            View profile
          </Link>
        </div>
      )}
      {serverError && (
        <div className="mt-4">
          <FormError message={serverError} />
        </div>
      )}

      <form id="add-student-form" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Personal Information</h2>

            <div className="mt-4 flex justify-center">
              <PhotoPicker key={photoKey} onChange={setPhoto} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="First Name *" placeholder="e.g. Oluwaseun" error={errors.firstName?.message} {...register("firstName")} />
              <Input label="Last Name *" placeholder="e.g. Adebayo" error={errors.lastName?.message} {...register("lastName")} />
              <Input label="Middle Name" placeholder="Optional" error={errors.middleName?.message} {...register("middleName")} />
              <Input label="Date of Birth *" type="date" max={todayInput()} error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
              <SelectField label="Gender *" error={errors.gender?.message} {...register("gender")}>
                <option value="" disabled>
                  Select Gender
                </option>
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
              <Input label="LGA" placeholder="Optional" error={errors.lga?.message} {...register("lga")} />
              <Input label="Religion" placeholder="Optional" error={errors.religion?.message} {...register("religion")} />
              <Input label="Student Phone" placeholder="Optional" error={errors.phone?.message} {...register("phone")} />
              <Input label="Student Email" type="email" placeholder="Optional" className="sm:col-span-2" error={errors.email?.message} {...register("email")} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Parent/Guardian Information</h2>

            {guardianMode === "none" ? (
              <p className="mt-3 text-sm text-slate-gray">
                Your role can&apos;t link guardians. Someone with guardian access can add them from the student&apos;s
                profile.
              </p>
            ) : (
              <>
                <div className="-mt-2">
                  <Tabs
                    tabs={guardianTabs}
                    active={guardianMode === "new" ? GUARDIAN_TABS[0] : GUARDIAN_TABS[1]}
                    onChange={(tab) => setValue("guardianMode", tab === GUARDIAN_TABS[0] ? "new" : "existing")}
                  />
                </div>
                <div className="mt-4 space-y-4">
                  {guardianMode === "new" ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input label="First Name *" error={errors.guardianFirstName?.message} {...register("guardianFirstName")} />
                        <Input label="Last Name *" error={errors.guardianLastName?.message} {...register("guardianLastName")} />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SelectField label="Relationship *" error={errors.relationship?.message} {...register("relationship")}>
                          <option value="" disabled>
                            Select Relationship
                          </option>
                          {GUARDIAN_RELATIONSHIPS.map((r) => (
                            <option key={r} value={r}>
                              {RELATIONSHIP_LABELS[r]}
                            </option>
                          ))}
                        </SelectField>
                        <Input label="Phone Number *" placeholder="08031234567" error={errors.guardianPhone?.message} {...register("guardianPhone")} />
                      </div>
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="parent@example.com"
                        error={errors.guardianEmail?.message}
                        {...register("guardianEmail")}
                      />
                      <Textarea
                        label="Residential Address *"
                        placeholder="Full residential address"
                        rows={3}
                        error={errors.guardianAddress?.message}
                        {...register("guardianAddress")}
                      />
                    </>
                  ) : (
                    <>
                      <ExistingGuardianPicker
                        selected={existingGuardianId}
                        onSelect={(id) => setValue("existingGuardianId", id, { shouldValidate: true })}
                        error={errors.existingGuardianId?.message}
                      />
                      <SelectField label="Relationship to this student *" error={errors.relationship?.message} {...register("relationship")}>
                        <option value="" disabled>
                          Select Relationship
                        </option>
                        {GUARDIAN_RELATIONSHIPS.map((r) => (
                          <option key={r} value={r}>
                            {RELATIONSHIP_LABELS[r]}
                          </option>
                        ))}
                      </SelectField>
                    </>
                  )}
                  <p className="text-xs text-slate-gray">Saved as the primary guardian. You can add more on the profile.</p>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Enrollment</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="Class/Arm" error={errors.classArmId?.message} {...register("classArmId")}>
                <ArmOptions />
              </SelectField>
              <Input label="Admission Date *" type="date" error={errors.admissionDate?.message} {...register("admissionDate")} />
              <div className="sm:col-span-2">
                <Input
                  label="Admission Number"
                  placeholder="Leave blank to generate automatically"
                  error={errors.studentId?.message}
                  {...register("studentId")}
                />
                <p className="mt-1.5 text-xs text-slate-gray">Can&apos;t be changed after admission.</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-gray/10 bg-white p-5">
            <h2 className="text-sm font-bold text-primary-navy">Medical (Optional)</h2>

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
                  label="Allergies/Conditions"
                  placeholder="List any known allergies..."
                  rows={2}
                  error={errors.allergies?.message}
                  {...register("allergies")}
                />
              </div>
              <Input
                label="Emergency Contact Name"
                placeholder="If different from parent"
                error={errors.emergencyContactName?.message}
                {...register("emergencyContactName")}
              />
              <Input label="Emergency Phone" placeholder="08031234567" error={errors.emergencyPhone?.message} {...register("emergencyPhone")} />
            </div>
            <p className="mt-3 text-xs text-slate-gray">Allergies and the emergency contact are saved in the student&apos;s notes.</p>
          </section>
        </div>
      </form>

      {/* Phones and tablets: the form is one long column, so save from the bottom too. */}
      <div className="mt-6 space-y-3 lg:hidden">
        {serverError && <FormError message={serverError} />}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            form="add-student-form"
            isLoading={isSubmitting && pressed === "save"}
            disabled={isSubmitting}
            onClick={() => choose("save")}
            className="sm:w-auto sm:flex-1"
          >
            <Save className="h-4 w-4" />
            Save Student
          </Button>
          <Button
            type="submit"
            form="add-student-form"
            variant="tonal"
            isLoading={isSubmitting && pressed === "another"}
            disabled={isSubmitting}
            onClick={() => choose("another")}
            className="sm:w-auto sm:flex-1"
          >
            Save & Add Another
          </Button>
        </div>
      </div>

      {saved && (
        <AddStudentSuccessModal
          student={saved.student}
          warnings={saved.warnings}
          onAddAnother={() => {
            setSaved(null);
            startOver(true);
          }}
        />
      )}
    </div>
  );
}
