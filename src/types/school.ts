/** Mirrors the backend's src/tenants/dto/{school,settings}.dto.ts and the permission catalogue. */

export type SchoolStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | string;

/** GET /schools/me */
export type School = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  email: string;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  country: string;
  logoUrl: string | null; // "/api/files/:id", needs the Bearer token, see useFileUrl
  motto: string | null;
  status: SchoolStatus;
  timezone: string;
  currency: string;
  createdAt: string;
};

/** PATCH /schools/me. Every field optional; the logo has its own upload endpoint. */
export type UpdateSchoolInput = Partial<{
  name: string; // 2-150
  shortName: string; // up to 20
  email: string;
  phone: string; // Nigerian format
  addressLine: string;
  city: string;
  state: string;
  motto: string;
}>;

/** Index is Date.getUTCDay(): 0 is Sunday, as the backend orders them. */
export const WEEKDAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** GET /schools/me/settings */
export type SchoolSettings = {
  admissionNumberPrefix: string | null;
  admissionNumberExample: string; // what the next admission number would look like
  receiptPrefix: string;
  portalEnabled: boolean;
  reminderCooldownDays: number; // 0-90
  invoiceDueDays: number | null; // 0-365; days to pay when a fee structure sets no due date
  reportShowPosition: boolean;
  reportShowClassStats: boolean;
  schoolDays: Weekday[]; // the days registers may be taken; at least one, week-ordered from Sunday
};

/** PATCH /schools/me/settings. Prefixes: 1-10 of A-Z, 0-9 or "-", uppercased by the backend. */
export type UpdateSchoolSettingsInput = Partial<Omit<SchoolSettings, "admissionNumberExample">>;

/** GET /schools/me/roles row. System roles come with every school and can't be deleted. */
export type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
};

/** GET /schools/me/permissions row. */
export type PermissionInfo = { key: string; group: string; description: string };

/** POST /schools/me/roles. Start empty, from a list, or copy another role's permissions. */
export type CreateRoleInput = { name: string; description?: string | null; permissions?: string[]; copyFromRoleId?: string };

/** GET /files/quota. The ceiling is set by EduGear, not the school. */
export type StorageQuota = { usedBytes: number; limitBytes: number; remainingBytes: number; percentUsed: number };

export type FilePurpose = "STUDENT_PHOTO" | "SCHOOL_LOGO" | "PAYMENT_EVIDENCE";

/** GET /files row. linkedType/linkedId say what's using it; null means nothing is. */
export type StoredFile = {
  id: string;
  purpose: FilePurpose;
  url: string;
  displayName: string;
  contentType: string;
  sizeBytes: number;
  linkedType: string | null;
  linkedId: string | null;
  createdAt: string;
};
