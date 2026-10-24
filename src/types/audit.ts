/** Mirrors AuditLogDto in the backend's src/audit/dto. */
export type AuditLog = {
  id: string;
  action: string; // e.g. "student.created", "auth.login.succeeded"
  entityType: string | null; // e.g. "Student"
  entityId: string | null;
  description: string | null; // human-readable, but not every action sets one
  metadata: unknown;
  ipAddress: string | null;
  requestId: string | null;
  createdAt: string;
  actor: { id: string; firstName: string; lastName: string; email: string } | null;
};
