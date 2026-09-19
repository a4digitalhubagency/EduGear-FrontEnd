"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  RELATIONSHIP_OPTIONS,
  guardianFormSchema,
  type GuardianFormValues,
} from "@/lib/validation/student";
import type { Guardian } from "@/types/student";

interface GuardianFormModalProps {
  mode: "add" | "edit";
  guardian?: Guardian;
  onClose: () => void;
  onSave: (values: GuardianFormValues) => void;
}

type GuardianFieldValues = Omit<GuardianFormValues, "isPrimary">;

/**
 * "Guardian Management - Interaction States" screen — the "Add Guardian"
 * modal. Stitch didn't design a separate edit modal, so this same form is
 * reused (pre-filled) for "Edit Details" on GuardianInformationCard's
 * per-guardian "Edit Details" button — same fields, different title/save
 * behavior. "Set as Primary Guardian" toggle copy matches the design
 * exactly ("Primary guardians receive all automated academic reports and
 * alerts.").
 */
export function GuardianFormModal({ mode, guardian, onClose, onSave }: GuardianFormModalProps) {
  // isPrimary is plain component state rather than a registered/watched
  // react-hook-form field — the toggle's only job is to flip a boolean for
  // display and for the final onSave payload, and watch() would otherwise
  // disable React Compiler memoization for this whole component.
  const [isPrimary, setIsPrimary] = useState(guardian?.isPrimary ?? false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuardianFieldValues>({
    resolver: zodResolver(guardianFormSchema.omit({ isPrimary: true })),
    defaultValues: {
      name: guardian?.name ?? "",
      relationship: guardian?.relationship ?? "",
      phone: guardian?.phone ?? "",
      email: guardian?.email ?? "",
      occupation: guardian?.occupation ?? "",
      address: guardian?.address ?? "",
    },
  });

  async function onSubmit(values: GuardianFieldValues) {
    // TODO: wire up to the real EduGear "add/update guardian" endpoint once the backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 300));
    onSave({ ...values, isPrimary });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-navy/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-navy">
            {mode === "add" ? "Add Guardian" : "Edit Guardian"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-gray hover:text-primary-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full Name *"
              placeholder="e.g. Zainab Bello"
              error={errors.name?.message}
              {...register("name")}
            />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
                Relationship *
              </label>
              <Select
                className="w-full"
                defaultValue={guardian?.relationship ?? ""}
                {...register("relationship")}
              >
                <option value="" disabled>
                  Select relationship
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Phone Number *"
              placeholder="+234 XXX XXXX"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="guardian@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          <Input label="Occupation" placeholder="e.g. Civil Engineer" {...register("occupation")} />

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary-navy">
              Residential Address
            </label>
            <Textarea placeholder="Full residential address" rows={2} {...register("address")} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-gray/10 bg-cloud-sky/20 p-3">
            <div className="pr-4">
              <p className="text-sm font-semibold text-primary-navy">Set as Primary Guardian</p>
              <p className="text-xs text-slate-gray">
                Primary guardians receive all automated academic reports and alerts.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPrimary}
              onClick={() => setIsPrimary((current) => !current)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                isPrimary ? "bg-bright-blue" : "bg-slate-gray/30"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  isPrimary ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Guardian
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}