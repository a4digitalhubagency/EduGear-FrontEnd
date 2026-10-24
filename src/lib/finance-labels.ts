import type { FeeStructureStatus, InvoiceStatus, PaymentMethod, PaymentStatus } from "@/types/finance";

/** Display labels and pill colours for the backend's finance enums. */

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  POS: "POS",
  ONLINE: "Online",
  CHEQUE: "Cheque",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Part Paid",
  PAID: "Paid",
  WAIVED: "Waived",
  CANCELLED: "Cancelled",
};

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  WAIVED: "bg-cloud-sky text-bright-blue",
  CANCELLED: "bg-slate-gray/10 text-slate-gray",
};

export const STRUCTURE_STATUS_LABELS: Record<FeeStructureStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const STRUCTURE_STATUS_STYLES: Record<FeeStructureStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-slate-gray/10 text-slate-gray",
};
