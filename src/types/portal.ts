/** Mirrors the backend's src/portal/dto/portal.dto.ts and the in-app notification DTOs. */

import type { AttendanceStatus } from "./attendance";
import type { PaymentMethod } from "./finance";

export type PortalLatestResult = {
  termId: string;
  termName: string; // "FIRST"
  sessionName: string;
  averageScore: number;
  positionLabel: string | null;
  outOf: number;
};

/** GET /portal/children row (and inside /portal/me). */
export type PortalChild = {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  photoUrl: string | null;
  className: string | null;
  relationship: string;
  feeBalance: number; // outstanding across all invoices
  pendingPayments: number; // sent to the school, awaiting verification
  latestResult: PortalLatestResult | null;
};

/** GET /portal/children/:studentId */
export type PortalChildOverview = PortalChild & {
  formTeacherName: string | null;
  currentTermId: string | null;
  currentTermName: string | null;
  attendance: { daysOpen: number; present: number; absent: number; late: number; excused: number; rate: number } | null;
};

/** GET /portal/me */
export type PortalMe = {
  guardianId: string;
  fullName: string;
  phone: string;
  email: string | null;
  schoolName: string;
  children: PortalChild[];
  unreadNotifications: number;
};

/** GET /portal/children/:studentId/results row: a term with published results. */
export type PortalResultTerm = PortalLatestResult & { publishedAt: string | null };

/** GET /portal/children/:studentId/attendance (defaults to the current term). */
export type PortalAttendance = {
  termId: string;
  termName: string;
  summary: { daysOpen: number; present: number; absent: number; late: number; excused: number; rate: number };
  records: { date: string; status: AttendanceStatus; note: string | null }[];
};

/** Parents can't record cash: that's paid and recorded at the school office. */
export const PORTAL_PAYMENT_METHODS = ["BANK_TRANSFER", "POS", "CHEQUE"] as const satisfies readonly PaymentMethod[];

/** POST /portal/children/:studentId/payments. Arrives PENDING until the bursar verifies it. */
export type SubmitPaymentInput = {
  studentFeeId: string;
  amount: number;
  method: (typeof PORTAL_PAYMENT_METHODS)[number];
  reference: string; // bank or teller reference, required
  evidenceUrl?: string; // from POST /portal/children/:studentId/evidence
  paidAt: string;
};

/** POST /portal/children/:studentId/payments/online: send the payer to authorizationUrl. */
export type StartedOnlinePayment = { paymentId: string; reference: string; authorizationUrl: string; amount: number };

export type NotificationType = "RESULT_PUBLISHED" | "PAYMENT_VERIFIED" | "PAYMENT_REJECTED" | "FEE_REMINDER" | "INVOICE_ISSUED";

export type PortalNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>; // e.g. { studentId }
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

/** GET /guardians/:guardianId/portal-access (staff side). */
export type PortalAccess = {
  guardianId: string;
  email: string;
  status: "NONE" | "INVITED" | "ACTIVE" | "SUSPENDED" | "REVOKED";
  invitedAt: string | null;
  acceptedAt: string | null;
  usesStaffLogin?: boolean; // a staff member who is also a parent uses their staff login
};
