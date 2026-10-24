"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { errorMessage } from "@/lib/api-client";
import { useUpdateSchoolSettings } from "@/lib/queries/school";
import { schoolSettingsSchema, type SchoolSettingsValues } from "@/lib/validation/settings";
import type { SchoolSettings } from "@/types/school";

function toFormValues(settings: SchoolSettings): SchoolSettingsValues {
  return {
    admissionNumberPrefix: settings.admissionNumberPrefix ?? "",
    receiptPrefix: settings.receiptPrefix,
    portalEnabled: settings.portalEnabled,
    reminderCooldownDays: String(settings.reminderCooldownDays),
    invoiceDueDays: settings.invoiceDueDays === null ? "" : String(settings.invoiceDueDays),
    reportShowPosition: settings.reportShowPosition,
    reportShowClassStats: settings.reportShowClassStats,
  };
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 border-b border-slate-gray/10 py-5 first:pt-0 last:border-0 md:grid-cols-3">
      <div>
        <p className="text-sm font-bold text-primary-navy">{title}</p>
        <p className="mt-1 text-xs text-slate-gray">{description}</p>
      </div>
      <div className="space-y-4 md:col-span-2">{children}</div>
    </div>
  );
}

/** "Preferences" tab: GET/PATCH /schools/me/settings. */
export function SchoolPreferencesForm({ settings, canUpdate }: { settings: SchoolSettings; canUpdate: boolean }) {
  const updateSettings = useUpdateSchoolSettings();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SchoolSettingsValues>({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: toFormValues(settings),
  });

  async function onSubmit(values: SchoolSettingsValues) {
    setServerError(null);
    setSaved(false);
    try {
      const updated = await updateSettings.mutateAsync({
        ...values,
        // Empty means "none": no admission prefix, or no default payment window.
        admissionNumberPrefix: values.admissionNumberPrefix || null,
        reminderCooldownDays: Number(values.reminderCooldownDays),
        invoiceDueDays: values.invoiceDueDays === "" ? null : Number(values.invoiceDueDays),
      });
      reset(toFormValues(updated));
      setSaved(true);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-xl border border-slate-gray/10 bg-white p-5">
      <fieldset disabled={!canUpdate}>
        <Section
          title="Numbering"
          description="Changes apply from now on: numbers already issued keep their prefix, and the sequence continues."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Input
                label="Admission Number Prefix"
                placeholder="None"
                className="uppercase"
                error={errors.admissionNumberPrefix?.message}
                {...register("admissionNumberPrefix")}
              />
              <p className="mt-1.5 text-xs text-slate-gray">
                Next number: <span className="font-semibold text-primary-navy">{settings.admissionNumberExample}</span>
              </p>
            </div>
            <Input
              label="Receipt Prefix *"
              placeholder="e.g. RCP"
              className="uppercase"
              error={errors.receiptPrefix?.message}
              {...register("receiptPrefix")}
            />
          </div>
        </Section>

        <Section title="Fees" description="How invoices and fee reminders behave.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Input
                label="Default Days to Pay"
                type="number"
                min={0}
                max={365}
                placeholder="No default"
                error={errors.invoiceDueDays?.message}
                {...register("invoiceDueDays")}
              />
              <p className="mt-1.5 text-xs text-slate-gray">Used when a fee structure sets no due date.</p>
            </div>
            <div>
              <Input
                label="Reminder Cooldown (days) *"
                type="number"
                min={0}
                max={90}
                error={errors.reminderCooldownDays?.message}
                {...register("reminderCooldownDays")}
              />
              <p className="mt-1.5 text-xs text-slate-gray">Skip parents reminded within this many days. 0 turns it off.</p>
            </div>
          </div>
        </Section>

        <Section title="Parent Portal" description="Turning it off blocks every parent login without revoking them.">
          <Checkbox label="Parents can sign in to the portal" {...register("portalEnabled")} />
        </Section>

        <Section title="Report Cards" description="What printed report cards show.">
          <Checkbox label="Show each student's position in class" {...register("reportShowPosition")} />
          <Checkbox label="Show class highest, lowest and average" {...register("reportShowClassStats")} />
        </Section>
      </fieldset>

      {canUpdate ? (
        <div className="space-y-3 pt-2">
          <FormError message={serverError} />
          {saved && !isDirty && <p className="text-sm font-medium text-green-700">Preferences saved.</p>}
          <div className="flex justify-end">
            <Button type="submit" className="w-auto px-6" isLoading={isSubmitting} disabled={!isDirty}>
              Save Preferences
            </Button>
          </div>
        </div>
      ) : (
        <p className="pt-2 text-xs text-slate-gray">You can view these settings but not change them.</p>
      )}
    </form>
  );
}
