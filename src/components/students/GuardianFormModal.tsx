"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import { LoadingText, Tabs } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks";
import {
  useCreateGuardian,
  useGuardian,
  useGuardianSearch,
  useLinkGuardian,
  useUpdateGuardian,
  useUpdateGuardianLink,
} from "@/lib/queries/guardians";
import { useCan } from "@/lib/store/auth-store";
import { RELATIONSHIP_LABELS } from "@/lib/student-labels";
import { cn } from "@/lib/utils";
import { guardianFormSchema, type GuardianFormValues } from "@/lib/validation/student";
import { GUARDIAN_RELATIONSHIPS, type GuardianProfile, type GuardianRelationship } from "@/types/guardians";
import type { StudentGuardianSummary } from "@/types/students";

const ADD_MODES = ["New guardian", "Existing guardian"] as const;

function RelationshipOptions() {
  return (
    <>
      <option value="" disabled>
        Select relationship
      </option>
      {GUARDIAN_RELATIONSHIPS.map((r) => (
        <option key={r} value={r}>
          {RELATIONSHIP_LABELS[r]}
        </option>
      ))}
    </>
  );
}

/** "" -> null for the guardian's optional nullable fields. */
const orNull = (value: string) => value || null;

function GuardianFields({
  defaults,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaults: GuardianFormValues;
  submitLabel: string;
  onSubmit: (values: GuardianFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuardianFormValues>({ resolver: zodResolver(guardianFormSchema), defaultValues: defaults });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setServerError(null);
        try {
          await onSubmit(values);
        } catch (err) {
          setServerError(errorMessage(err));
        }
      })}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="First Name *" error={errors.firstName?.message} {...register("firstName")} />
        <Input label="Last Name *" error={errors.lastName?.message} {...register("lastName")} />
        <SelectField label="Relationship *" error={errors.relationship?.message} {...register("relationship")}>
          <RelationshipOptions />
        </SelectField>
        <Input label="Phone Number *" placeholder="08031234567" error={errors.phone?.message} {...register("phone")} />
        <Input label="Other Phone" placeholder="Optional" error={errors.altPhone?.message} {...register("altPhone")} />
        <Input label="Email Address" type="email" placeholder="parent@example.com" error={errors.email?.message} {...register("email")} />
        <Input label="Occupation" error={errors.occupation?.message} {...register("occupation")} />
        <Input label="Address" error={errors.addressLine?.message} {...register("addressLine")} />
      </div>
      <div className="space-y-2 rounded-lg bg-cloud-sky/30 p-3">
        <Checkbox id="guardian-primary" label="Primary guardian (receives reports, alerts and fee reminders)" {...register("isPrimary")} />
        <Checkbox id="guardian-pickup" label="Allowed to pick the student up" {...register("canPickUp")} />
      </div>
      <FormError message={serverError} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="w-auto flex-1" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Search existing guardians (name or phone) and link one, e.g. a sibling's parent. */
function LinkExistingGuardian({
  studentId,
  linkedIds,
  makePrimary,
  onDone,
  onCancel,
}: {
  studentId: string;
  linkedIds: string[];
  makePrimary: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const results = useGuardianSearch(useDebouncedValue(search));
  const [picked, setPicked] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<GuardianRelationship | "">("");
  const [error, setError] = useState<string | null>(null);
  const link = useLinkGuardian();

  async function submit() {
    if (!picked) return setError("Choose a guardian.");
    if (!relationship) return setError("Select the relationship.");
    setError(null);
    try {
      await link.mutateAsync({ studentId, input: { guardianId: picked, relationship, isPrimary: makePrimary } });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const rows = (results.data?.data ?? []).filter((g) => !linkedIds.includes(g.id));

  return (
    <div className="space-y-4">
      <Input icon={Search} placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
      <ul className="max-h-56 divide-y divide-slate-gray/10 overflow-y-auto rounded-lg border border-slate-gray/10">
        {search.trim().length < 2 ? (
          <li className="px-3 py-3 text-sm text-slate-gray">Type at least 2 characters.</li>
        ) : results.isPending ? (
          <li className="px-3 py-3 text-sm text-slate-gray">
            <LoadingText label="Searching..." />
          </li>
        ) : rows.length === 0 ? (
          <li className="px-3 py-3 text-sm text-slate-gray">No other guardians match.</li>
        ) : (
          rows.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => setPicked(g.id)}
                aria-pressed={picked === g.id}
                className={cn("w-full px-3 py-2.5 text-left hover:bg-cloud-sky/30", picked === g.id && "bg-cloud-sky/50")}
              >
                <span className="block text-sm font-semibold text-primary-navy">{g.fullName}</span>
                <span className="text-xs text-slate-gray">
                  {g.phone} · {g.wardCount} ward{g.wardCount === 1 ? "" : "s"}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      <SelectField label="Relationship to this student *" value={relationship} onChange={(e) => setRelationship(e.target.value as GuardianRelationship)}>
        <RelationshipOptions />
      </SelectField>
      <FormError message={error} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onCancel} disabled={link.isPending}>
          Cancel
        </Button>
        <Button type="button" className="w-auto flex-1" onClick={submit} isLoading={link.isPending}>
          Link Guardian
        </Button>
      </div>
    </div>
  );
}

const EMPTY: GuardianFormValues = {
  firstName: "",
  lastName: "",
  relationship: "" as GuardianRelationship, // the resolver rejects "", so this only covers the empty start
  phone: "",
  altPhone: "",
  email: "",
  addressLine: "",
  occupation: "",
  isPrimary: false,
  canPickUp: true, // the backend's own default
};

function toFormValues(guardian: GuardianProfile, link: StudentGuardianSummary): GuardianFormValues {
  return {
    firstName: guardian.firstName,
    lastName: guardian.lastName,
    relationship: link.relationship,
    phone: guardian.phone,
    altPhone: guardian.altPhone ?? "",
    email: guardian.email ?? "",
    addressLine: guardian.addressLine ?? "",
    occupation: guardian.occupation ?? "",
    isPrimary: link.isPrimary,
    canPickUp: link.canPickUp,
  };
}

interface GuardianFormModalProps {
  studentId: string;
  /** Present when editing an existing link. */
  link?: StudentGuardianSummary;
  /** Guardians already linked, hidden from the "existing guardian" search. */
  linkedIds: string[];
  onClose: () => void;
}

/**
 * Add or edit a student's guardian ("Guardian Management - Interaction States").
 * Adding offers a new guardian (POST /guardians, then link) or an existing one, so a
 * sibling's parent is linked rather than duplicated. Editing updates the guardian's own
 * record and the link (relationship, primary, pick-up) separately, as the backend stores them.
 */
export function GuardianFormModal({ studentId, link, linkedIds, onClose }: GuardianFormModalProps) {
  // Creating a guardian record needs guardians.create; linking an existing one only guardians.update.
  const canCreate = useCan("guardians.create");
  const addModes = canCreate ? ADD_MODES : ([ADD_MODES[1]] as const);
  const [mode, setMode] = useState<(typeof ADD_MODES)[number]>(addModes[0]);
  const guardian = useGuardian(link?.guardianId);
  const create = useCreateGuardian();
  const update = useUpdateGuardian();
  const linkGuardian = useLinkGuardian();
  const updateLink = useUpdateGuardianLink();
  const firstGuardian = linkedIds.length === 0;

  async function addNew(v: GuardianFormValues) {
    const created = await create.mutateAsync({
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone,
      altPhone: orNull(v.altPhone),
      email: orNull(v.email),
      addressLine: orNull(v.addressLine),
      occupation: orNull(v.occupation),
    });
    await linkGuardian.mutateAsync({
      studentId,
      input: { guardianId: created.id, relationship: v.relationship, isPrimary: v.isPrimary, canPickUp: v.canPickUp },
    });
    onClose();
  }

  async function saveEdit(v: GuardianFormValues) {
    if (!link) return;
    await update.mutateAsync({
      id: link.guardianId,
      input: {
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone,
        altPhone: orNull(v.altPhone),
        email: orNull(v.email),
        addressLine: orNull(v.addressLine),
        occupation: orNull(v.occupation),
      },
    });
    await updateLink.mutateAsync({
      studentId,
      guardianId: link.guardianId,
      input: { relationship: v.relationship, isPrimary: v.isPrimary, canPickUp: v.canPickUp },
    });
    onClose();
  }

  if (link) {
    return (
      <Modal title="Edit Guardian" onClose={onClose} className="max-w-xl">
        {guardian.isPending ? (
          <LoadingText label="Loading guardian..." />
        ) : guardian.isError ? (
          <FormError message={errorMessage(guardian.error)} />
        ) : (
          <GuardianFields defaults={toFormValues(guardian.data, link)} submitLabel="Save Changes" onSubmit={saveEdit} onCancel={onClose} />
        )}
      </Modal>
    );
  }

  return (
    <Modal title="Add Guardian" onClose={onClose} className="max-w-xl">
      <div className="-mt-5">
        <Tabs tabs={addModes} active={mode} onChange={setMode} />
      </div>
      <div className="mt-4">
        {mode === "New guardian" ? (
          <GuardianFields
            // The first guardian added is the natural primary contact.
            defaults={{ ...EMPTY, isPrimary: firstGuardian }}
            submitLabel="Add Guardian"
            onSubmit={addNew}
            onCancel={onClose}
          />
        ) : (
          <LinkExistingGuardian studentId={studentId} linkedIds={linkedIds} makePrimary={firstGuardian} onDone={onClose} onCancel={onClose} />
        )}
      </div>
    </Modal>
  );
}
