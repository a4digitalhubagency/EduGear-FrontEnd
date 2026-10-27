/** Mirrors the backend's src/platform/dto/platform.dto.ts (A4's own console: metadata only). */

/** SUPPORT reads; OPERATOR also suspends, reactivates, cancels and sets quotas; OWNER also manages operators. */
export type PlatformRole = "SUPPORT" | "OPERATOR" | "OWNER";
export const PLATFORM_ROLES: PlatformRole[] = ["SUPPORT", "OPERATOR", "OWNER"];

export type PlatformOperator = { id: string; email: string; role: PlatformRole };

export type SchoolStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
export const SCHOOL_STATUSES: SchoolStatus[] = ["ACTIVE", "PENDING", "SUSPENDED", "CANCELLED"];

export type PlatformSchool = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  email: string;
  phone: string | null;
  state: string | null;
  status: SchoolStatus;
  deletedAt: string | null;
  createdAt: string;
  studentCount: number; // ACTIVE students only
  staffCount: number; // active memberships
  classArmCount: number;
  storageBytes: number;
  storageQuotaMb: number;
  storageQuotaIsCustom: boolean; // false while on the platform default
  ownerEmail: string | null;
  lastActivityAt: string | null; // most recent staff login
};

export type PlatformStats = {
  totalSchools: number;
  activeSchools: number;
  suspendedSchools: number;
  pendingSchools: number;
  cancelledSchools: number;
  totalStudents: number;
  totalStaff: number;
  storageBytes: number;
  newSchoolsLast30Days: number;
};

export type PlatformAdmin = {
  id: string;
  email: string;
  fullName: string;
  role: PlatformRole;
  userStatus: string;
  lastLoginAt: string | null;
  disabledAt: string | null;
  createdAt: string;
};
