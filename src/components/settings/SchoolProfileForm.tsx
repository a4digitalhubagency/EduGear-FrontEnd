"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, School as SchoolIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { errorMessage } from "@/lib/api-client";
import { NIGERIAN_STATES } from "@/lib/nigerian-states";
import { useFileUrl } from "@/lib/queries/files";
import { useRemoveSchoolLogo, useUpdateSchool, useUploadSchoolLogo } from "@/lib/queries/school";
import { schoolProfileSchema, type SchoolProfileValues } from "@/lib/validation/settings";
import type { School, UpdateSchoolInput } from "@/types/school";

const LOGO_TYPES = "image/png,image/jpeg,image/webp";

function toFormValues(school: School): SchoolProfileValues {
  return {
    name: school.name,
    shortName: school.shortName ?? "",
    email: school.email,
    phone: school.phone ?? "",
    addressLine: school.addressLine ?? "",
    city: school.city ?? "",
    state: school.state ?? "",
    motto: school.motto ?? "",
  };
}

function SchoolLogo({ school, canUpdate }: { school: School; canUpdate: boolean }) {
  const src = useFileUrl(school.logoUrl);
  const upload = useUploadSchoolLogo();
  const remove = useRemoveSchoolLogo();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    upload.mutate(file, { onError: (err) => setError(errorMessage(err)) });
    if (input.current) input.current.value = ""; // so picking the same file again still fires
  }

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <p className="text-sm font-bold text-primary-navy">School Logo</p>
      <p className="mt-1 text-xs text-slate-gray">Printed on receipts, statements and report cards.</p>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-gray/10 bg-cloud-sky/40">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- object/blob URLs can't go through next/image
            <img src={src} alt={`${school.name} logo`} className="h-full w-full object-contain" />
          ) : (
            <SchoolIcon className="h-8 w-8 text-bright-blue" />
          )}
        </div>
        {canUpdate && (
          <div className="flex flex-col gap-2">
            <input ref={input} type="file" accept={LOGO_TYPES} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button
              type="button"
              variant="secondary"
              className="w-auto px-4 py-2"
              onClick={() => input.current?.click()}
              isLoading={upload.isPending}
            >
              <ImagePlus className="h-4 w-4" />
              {school.logoUrl ? "Replace" : "Upload"}
            </Button>
            {school.logoUrl && (
              <Button
                type="button"
                variant="ghost"
                className="w-auto px-4 py-2 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setError(null);
                  remove.mutate(undefined, { onError: (err) => setError(errorMessage(err)) });
                }}
                isLoading={remove.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-gray">PNG, JPG or WebP.</p>
      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}
    </div>
  );
}

/** "School Profile" tab: GET/PATCH /schools/me plus the logo endpoints. */
export function SchoolProfileForm({ school, canUpdate }: { school: School; canUpdate: boolean }) {
  const updateSchool = useUpdateSchool();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<SchoolProfileValues>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: toFormValues(school),
  });

  async function onSubmit(values: SchoolProfileValues) {
    setServerError(null);
    setSaved(false);
    // Only changed, non-empty fields: UpdateSchoolDto has no way to clear a field
    // (an empty phone or email fails its validation), so "" means "leave as is".
    const input: UpdateSchoolInput = {};
    for (const key of Object.keys(dirtyFields) as (keyof SchoolProfileValues)[]) {
      if (values[key] !== "") input[key] = values[key];
    }
    try {
      const updated = await updateSchool.mutateAsync(input);
      reset(toFormValues(updated));
      setSaved(true);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4 rounded-xl border border-slate-gray/10 bg-white p-5 lg:col-span-2"
      >
        <fieldset disabled={!canUpdate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="School Name *" error={errors.name?.message} {...register("name")} />
            <Input label="Short Name" placeholder="e.g. BSC" error={errors.shortName?.message} {...register("shortName")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="School Email *" type="email" error={errors.email?.message} {...register("email")} />
            <Input label="Phone" placeholder="08031234567" error={errors.phone?.message} {...register("phone")} />
          </div>
          <Input label="Address" error={errors.addressLine?.message} {...register("addressLine")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="City" placeholder="e.g. Ibadan" error={errors.city?.message} {...register("city")} />
            <SelectField label="State" error={errors.state?.message} {...register("state")}>
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </SelectField>
          </div>
          <Input label="Motto" placeholder="e.g. Knowledge and Character" error={errors.motto?.message} {...register("motto")} />
        </fieldset>

        {canUpdate ? (
          <>
            <p className="text-xs text-slate-gray">
              Leaving an optional field empty keeps its current value; it can&apos;t be cleared from here yet.
            </p>
            <FormError message={serverError} />
            {saved && !isDirty && <p className="text-sm font-medium text-green-700">School profile saved.</p>}
            <div className="flex justify-end">
              <Button type="submit" className="w-auto px-6" isLoading={isSubmitting} disabled={!isDirty}>
                Save Changes
              </Button>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-gray">You can view the school profile but not change it.</p>
        )}
      </form>

      <SchoolLogo school={school} canUpdate={canUpdate} />
    </div>
  );
}
