"use client";

import { useState } from "react";
import { Pencil, Search, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  IconAction,
  LoadingText,
  PaginationFooter,
  Pill,
  RetryButton,
  TABLE_HEAD_ROW,
  TABLE_ROW,
  TableStateRow,
} from "@/components/ui/table";
import { EditStaffModal, InviteStaffModal, staffRoles } from "@/components/personnel/StaffFormModals";
import { errorMessage } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks";
import { useRoles } from "@/lib/queries/school";
import { useRevokeMembership, useStaff } from "@/lib/queries/users";
import { useAuthStore, useCan } from "@/lib/store/auth-store";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import type { MembershipStatus, StaffMember } from "@/types/users";

const COLUMNS = 6;

const STATUS_STYLES: Record<MembershipStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INVITED: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-red-100 text-red-700",
  REVOKED: "bg-slate-gray/10 text-slate-gray",
};

const STATUS_LABELS: Record<MembershipStatus, string> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  SUSPENDED: "Suspended",
  REVOKED: "Revoked",
};

export function StaffPanel() {
  const canInvite = useCan("users.create");
  const canUpdate = useCan("users.update");
  const canRevoke = useCan("users.delete");
  const canReadRoles = useCan("roles.read");
  const myMembershipId = useAuthStore((s) => s.activeSchool?.membershipId);

  const roles = useRoles(canReadRoles);
  const roleList = roles.data ?? [];

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MembershipStatus | "">("");
  const [roleId, setRoleId] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const staff = useStaff({
    page,
    limit: 20,
    search: debouncedSearch.trim() || undefined,
    status: status || undefined,
    roleId: roleId || undefined,
    sortBy: "lastName",
    sortOrder: "asc",
  });

  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [revoking, setRevoking] = useState<StaffMember | null>(null);
  const revoke = useRevokeMembership();

  const rows = staff.data?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            icon={Search}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="py-2.5"
            aria-label="Search staff"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as MembershipStatus | "");
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          {(Object.keys(STATUS_LABELS) as MembershipStatus[]).map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
        {canReadRoles && (
          <Select
            value={roleId}
            onChange={(e) => {
              setRoleId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            {staffRoles(roleList).map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        )}
        {canInvite && (
          <Button
            type="button"
            className="w-auto px-4 py-2.5"
            onClick={() => setInviting(true)}
            // The invite form needs the role list.
            disabled={!canReadRoles || !roles.data}
            title={!canReadRoles ? "Viewing roles is needed to invite staff" : undefined}
          >
            <UserPlus className="h-4 w-4" />
            Invite Staff
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-gray/10 bg-white">
        <table className={cn("w-full min-w-[820px] text-left text-sm", staff.isPlaceholderData && "opacity-60")}>
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Staff Member</th>
              <th className="px-4 py-3">Staff No.</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Sign-in</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.isPending ? (
              <TableStateRow colSpan={COLUMNS}>
                <LoadingText label="Loading staff..." />
              </TableStateRow>
            ) : staff.isError ? (
              <TableStateRow colSpan={COLUMNS}>
                {errorMessage(staff.error)}
                <RetryButton onRetry={() => staff.refetch()} />
              </TableStateRow>
            ) : rows.length === 0 ? (
              <TableStateRow colSpan={COLUMNS}>No staff match your filters.</TableStateRow>
            ) : (
              rows.map((member) => {
                const isMe = member.membershipId === myMembershipId;
                const editable = member.status !== "REVOKED";
                return (
                  <tr key={member.membershipId} className={TABLE_ROW}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cloud-sky text-xs font-semibold text-bright-blue">
                          {getInitials(`${member.firstName} ${member.lastName}`)}
                        </div>
                        <div>
                          <p className="font-semibold text-primary-navy">
                            {member.firstName} {member.lastName}
                            {isMe && <span className="ml-1.5 text-xs font-medium text-slate-gray">(you)</span>}
                          </p>
                          <p className="text-xs text-slate-gray">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-gray">{member.staffId ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-gray">{member.roleName}</td>
                    <td className="px-4 py-3">
                      <Pill className={STATUS_STYLES[member.status]}>{STATUS_LABELS[member.status]}</Pill>
                    </td>
                    <td className="px-4 py-3 text-slate-gray">
                      {member.lastLoginAt ? formatRelativeTime(member.lastLoginAt) : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canUpdate && editable && (
                          <IconAction
                            icon={Pencil}
                            label={`Edit ${member.firstName} ${member.lastName}`}
                            onClick={() => setEditing(member)}
                            disabledReason={
                              isMe ? "You can't change your own role or status." : !roles.data ? "Loading roles..." : null
                            }
                          />
                        )}
                        {canRevoke && editable && !isMe && (
                          <IconAction
                            icon={UserMinus}
                            label={`Revoke ${member.firstName} ${member.lastName}'s access`}
                            tone="danger"
                            onClick={() => setRevoking(member)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <PaginationFooter meta={staff.data?.meta} noun="staff" onPageChange={setPage} />
      </div>

      {inviting && roles.data && <InviteStaffModal roles={roles.data} onClose={() => setInviting(false)} />}
      {editing && roles.data && <EditStaffModal member={editing} roles={roles.data} onClose={() => setEditing(null)} />}
      {revoking && (
        <ConfirmDialog
          title="Revoke Access?"
          description={
            <>
              <span className="font-semibold text-primary-navy">
                {revoking.firstName} {revoking.lastName}
              </span>{" "}
              will no longer be able to sign in to this school. Their EduGear account and history are kept.
            </>
          }
          confirmLabel="Revoke"
          onConfirm={() => revoke.mutateAsync(revoking.membershipId)}
          onClose={() => setRevoking(null)}
        />
      )}
    </div>
  );
}
