/** Mirrors StaffMemberDto in the backend's src/users/dto/user.dto.ts. */
export type MembershipStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REVOKED";

export type StaffMember = {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  staffId: string | null;
  roleId: string;
  roleName: string;
  roleSlug: string;
  status: MembershipStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

/** POST /users/invite. Reuses an existing EduGear account when the email is already registered. */
export type InviteStaffInput = {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone?: string;
  staffId?: string;
};

/** PATCH /users/:membershipId. Only ACTIVE <-> SUSPENDED here; revoking has its own endpoint. */
export type UpdateMembershipInput = {
  roleId?: string;
  status?: "ACTIVE" | "SUSPENDED";
  staffId?: string;
};

export type StaffQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: MembershipStatus;
  roleId?: string;
  sortBy?: "createdAt" | "lastName" | "email";
  sortOrder?: "asc" | "desc";
};
