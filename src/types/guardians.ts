/** Mirrors the backend's src/guardians/dto/guardian.dto.ts. */

export const GUARDIAN_RELATIONSHIPS = [
  "FATHER",
  "MOTHER",
  "GUARDIAN",
  "GRANDPARENT",
  "SIBLING",
  "UNCLE",
  "AUNT",
  "OTHER",
] as const;
export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIPS)[number];

export type GuardianPortalStatus = "NONE" | "INVITED" | "ACTIVE" | "SUSPENDED" | "REVOKED";

export type Guardian = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  altPhone: string | null;
  email: string | null;
  addressLine: string | null;
  occupation: string | null;
  wardCount: number;
  hasPortalAccess: boolean;
  portalStatus: GuardianPortalStatus;
  createdAt: string;
  updatedAt: string;
};

/** A student this guardian is linked to, as listed on the guardian's profile. */
export type GuardianWard = {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  className: string | null;
  relationship: GuardianRelationship;
  isPrimary: boolean;
  canPickUp: boolean;
};

/** GET /guardians/:id, and what link / update-link return. */
export type GuardianProfile = Guardian & { wards: GuardianWard[] };

export type CreateGuardianInput = {
  firstName: string;
  lastName: string;
  phone: string; // must match the Nigerian format: 0803..., 234803..., +234803...
  altPhone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  occupation?: string | null;
};

export type UpdateGuardianInput = Partial<CreateGuardianInput>;

/** POST /students/:studentId/guardians. At most one primary guardian per student. */
export type LinkGuardianInput = {
  guardianId: string;
  relationship: GuardianRelationship;
  isPrimary?: boolean;
  canPickUp?: boolean;
};

export type UpdateGuardianLinkInput = Partial<Omit<LinkGuardianInput, "guardianId">>;
