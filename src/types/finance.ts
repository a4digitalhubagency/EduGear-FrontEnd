/** Mirrors the backend's src/finance/dto/*.dto.ts. Amounts are plain naira (not kobo). */

import type { PageQuery } from "./api";

export const MAX_FEE_AMOUNT = 100_000_000;
export const MAX_STRUCTURE_ITEMS = 50;
export const MAX_ASSIGN_STUDENTS = 500;

export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "POS", "ONLINE", "CHEQUE"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Recorded money is PENDING until verified; only VERIFIED payments reduce a balance. */
export const PAYMENT_STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const INVOICE_STATUSES = ["UNPAID", "PARTIAL", "PAID", "WAIVED", "CANCELLED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const FEE_STRUCTURE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type FeeStructureStatus = (typeof FEE_STRUCTURE_STATUSES)[number];

// --- Reports ---------------------------------------------------------------

/** GET /finance/reports/summary query. Every filter is optional. */
export type FinanceReportQuery = {
  sessionId?: string;
  termId?: string;
  classId?: string;
  classArmId?: string;
};

export type FinanceSummary = {
  invoiceCount: number;
  studentCount: number; // students with at least one invoice
  totalBilled: number; // before discounts
  totalDiscounted: number;
  totalPayable: number; // billed less discounts
  totalCollected: number; // VERIFIED payments only
  totalOutstanding: number;
  pendingVerification: number; // recorded but not yet verified
  collectionRate: number; // collected as a share of payable, 0-100
  debtorCount: number; // invoices still owing (not students)
};

export type PaymentMethodBreakdown = { method: PaymentMethod; count: number; total: number };

/** GET /finance/reports/summary response (CollectionReportDto). */
export type CollectionReport = FinanceSummary & { byMethod: PaymentMethodBreakdown[] };

/** GET /finance/reports/debtors row: one student who still owes, largest debt first. */
export type Debtor = {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  className: string | null;
  totalOwed: number;
  invoiceCount: number;
  earliestDueDate: string | null;
  isOverdue: boolean;
  guardianContacts: string[];
  lastRemindedAt: string | null;
};

export type DebtorsQuery = PageQuery & {
  sessionId?: string;
  termId?: string;
  classArmId?: string;
  minBalance?: number;
  overdueOnly?: boolean;
};

/** POST /finance/reminders. dryRun reports who would be emailed without sending. */
export type SendRemindersInput = {
  sessionId?: string;
  termId?: string;
  classArmId?: string;
  studentIds?: string[];
  minBalance?: number;
  cooldownDays?: number; // 0-90; skip students reminded within this many days
  message?: string;
  dryRun?: boolean;
};

export type ReminderRecipient = {
  guardianName: string;
  email: string;
  children: { studentId: string; studentName: string; admissionNumber: string; className: string | null; amountOwed: number; dueDate: string | null }[];
  totalOwed: number;
  delivered: boolean | null; // null on a dry run
};

export type SendRemindersResult = {
  batchId: string | null;
  dryRun: boolean;
  debtors: number;
  sent: number;
  failed: number;
  studentsReminded: number;
  skippedNoEmail: number;
  recipients: ReminderRecipient[];
  unreachable: { studentId: string; studentName: string; admissionNumber: string; className: string | null; amountOwed: number; guardianPhones: string[] }[];
  skipped: { studentId: string; studentName: string; reason: "RECENTLY_REMINDED" | "PAYMENT_PENDING"; detail: string }[];
};

// --- Payments --------------------------------------------------------------

export type Payment = {
  id: string;
  studentFeeId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  receiptNumber: string | null; // issued on verification only
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  evidenceUrl: string | null;
  paidAt: string;
  status: PaymentStatus;
  note: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  invoiceBalance: number; // invoice balance after this payment
  createdAt: string;
};

export type PaymentsQuery = PageQuery & {
  studentId?: string;
  studentFeeId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  paidFrom?: string;
  paidTo?: string;
  sortBy?: "paidAt" | "amount" | "createdAt";
};

/** POST /finance/payments */
export type RecordPaymentInput = {
  studentFeeId: string;
  amount: number; // 0.01 - MAX_FEE_AMOUNT; can't exceed the invoice balance
  method: PaymentMethod;
  reference?: string | null; // teller number, transfer reference or POS stub
  paidAt: string;
  note?: string | null;
};

/** GET /finance/payments/:id/receipt (verified payments only). */
export type Receipt = {
  receiptNumber: string;
  issuedAt: string;
  school: {
    name: string;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    email: string;
    logoUrl: string | null;
    motto: string | null;
  };
  student: { id: string; admissionNumber: string; fullName: string; className: string | null };
  invoiceId: string;
  feeDescription: string;
  amount: number;
  amountInWords: string;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  invoicePayable: number;
  paidToDate: number;
  balanceAfter: number;
  receivedBy: string | null;
};

// --- Invoices (student fees) ----------------------------------------------

export type Invoice = {
  id: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  className: string | null;
  structureId: string;
  structureName: string;
  sessionId: string;
  termId: string | null;
  totalAmount: number; // what was billed
  discountAmount: number;
  payableAmount: number; // total less discount
  amountPaid: number; // VERIFIED payments only
  balance: number;
  status: InvoiceStatus;
  dueDate: string | null;
  waiverReason: string | null;
  items: { id: string; categoryName: string; amount: number }[];
  createdAt: string;
  updatedAt: string;
};

export type InvoicesQuery = PageQuery & {
  studentId?: string;
  structureId?: string;
  sessionId?: string;
  termId?: string;
  classArmId?: string;
  status?: InvoiceStatus;
  owing?: boolean; // UNPAID or PARTIAL only
  sortBy?: "createdAt" | "dueDate" | "totalAmount";
};

/** POST /finance/invoices/assign: invoice a whole arm (its ACTIVE students) or listed students. */
export type AssignInvoicesInput = {
  structureId: string; // must be PUBLISHED
  classArmId?: string;
  studentIds?: string[];
  includeOptionalItemIds?: string[];
  dueDate?: string;
};

export type AssignInvoicesResult = {
  assigned: number;
  skipped: number; // students who already had this invoice
  totalBilled: number;
  invoices: Invoice[];
};

// --- Fee structures and categories ----------------------------------------

/** A kind of charge: Tuition, Books, PTA levy. */
export type FeeCategory = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  usageCount: number; // fee structures using it
  createdAt: string;
  updatedAt: string;
};

export type FeeStructureItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  isOptional: boolean; // billed only when opted in, e.g. a bus place
};

export type FeeStructure = {
  id: string;
  name: string;
  description: string | null;
  sessionId: string;
  sessionName: string;
  termId: string | null; // null: covers the whole session
  termName: string | null;
  classId: string | null; // null: every class
  className: string | null;
  status: FeeStructureStatus;
  dueDate: string | null;
  totalAmount: number; // sum of the compulsory items
  items: FeeStructureItem[];
  invoiceCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FeeStructureItemInput = { categoryId: string; amount: number; isOptional?: boolean };

/** POST /finance/fee-structures */
export type CreateFeeStructureInput = {
  name: string;
  sessionId: string;
  termId?: string | null;
  classId?: string | null;
  description?: string | null;
  dueDate?: string | null;
  items: FeeStructureItemInput[];
};

/** PATCH /finance/fee-structures/:id. Session, term and class are fixed once created. */
export type UpdateFeeStructureInput = {
  name?: string;
  description?: string | null;
  dueDate?: string | null;
  items?: FeeStructureItemInput[]; // replaces the whole list
};

// --- Student statement -----------------------------------------------------

/** GET /finance/students/:studentId/statement (optional sessionId / termId). */
export type StudentStatement = {
  school: Receipt["school"];
  student: Receipt["student"];
  generatedAt: string;
  totalBilled: number;
  totalDiscounted: number;
  totalPaid: number;
  totalWaived: number;
  closingBalance: number;
  pendingVerification: number; // recorded but not yet verified
  invoices: {
    id: string;
    structureName: string;
    totalAmount: number;
    discountAmount: number;
    amountPaid: number;
    balance: number;
    status: InvoiceStatus;
    dueDate: string | null;
  }[];
  /** Running-balance ledger, oldest first. */
  ledger: {
    date: string;
    type: "INVOICE" | "DISCOUNT" | "WAIVER" | "PAYMENT";
    description: string;
    debit: number;
    credit: number;
    balance: number;
    reference: string | null; // receipt number
  }[];
  payments: {
    id: string;
    receiptNumber: string | null;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    paidAt: string;
    rejectionReason: string | null;
  }[];
};
