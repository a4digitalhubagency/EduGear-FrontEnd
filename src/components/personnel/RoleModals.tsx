"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api-client";
import { useCreateRole, useDeleteRole, useReassignRoleMembers, useSetRolePermissions, useUpdateRole } from "@/lib/queries/school";
import { useAuthStore } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils";
import type { PermissionInfo, Role } from "@/types/school";

/** "users" -> "Users", "school" -> "School". */
export const groupLabel = (group: string) => group.charAt(0).toUpperCase() + group.slice(1).replaceAll("_", " ");

/** Portal access comes from linking a parent record, never from a staff role (the backend refuses it). */
const isPortalKey = (key: string) => key.startsWith("portal.");

function Footer({ onClose, pending, label, disabled }: { onClose: () => void; pending: boolean; label: string; disabled?: boolean }) {
  return (
    <div className="flex gap-3 pt-2">
      <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={pending}>
        Cancel
      </Button>
      <Button type="submit" className="w-auto flex-1" isLoading={pending} disabled={disabled}>
        {label}
      </Button>
    </div>
  );
}

/** New role (optionally copying another's permissions), or rename/re-describe an existing one. */
export function RoleFormModal({ role, roles, onClose, onCreated }: { role?: Role; roles: Role[]; onClose: () => void; onCreated?: (role: Role) => void }) {
  const create = useCreateRole();
  const update = useUpdateRole();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [copyFrom, setCopyFrom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Give the role a name of at least 2 characters.");
    setError(null);
    try {
      if (role) {
        // Standard roles keep their names, so only send the name when it changed.
        await update.mutateAsync({ id: role.id, input: { ...(name.trim() !== role.name ? { name: name.trim() } : {}), description: description.trim() || null } });
        onClose();
      } else {
        const created = await create.mutateAsync({ name: name.trim(), description: description.trim() || null, ...(copyFrom ? { copyFromRoleId: copyFrom } : {}) });
        onCreated?.(created);
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title={role ? "Edit Role" : "New Role"} onClose={onClose}>
      <form onSubmit={save} noValidate className="space-y-4">
        <Input label="Role Name *" placeholder="e.g. Exams Officer" maxLength={60} value={name} disabled={role?.isSystem} onChange={(e) => setName(e.target.value)} />
        {role?.isSystem && <p className="-mt-2 text-xs text-slate-gray">Standard roles keep their names. You can still change the description.</p>}
        <Textarea label="Description" rows={2} maxLength={255} placeholder="What this role is for" value={description} onChange={(e) => setDescription(e.target.value)} />
        {!role && (
          <SelectField label="Start with permissions from" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="">No permissions (choose them next)</option>
            {roles
              .filter((r) => r.slug !== "PARENT")
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
          </SelectField>
        )}
        <FormError message={error} />
        <Footer onClose={onClose} pending={pending} label={role ? "Save" : "Create Role"} />
      </form>
    </Modal>
  );
}

/**
 * Tick what the role allows. Saved as the complete set (PUT .../permissions). You can only
 * grant what you hold yourself, so anything else is shown but locked; a permission the
 * role already has stays as it is.
 */
export function RolePermissionsModal({ role, catalogue, onClose }: { role: Role; catalogue: PermissionInfo[]; onClose: () => void }) {
  const setPermissions = useSetRolePermissions();
  const mine = useAuthStore((s) => s.permissions);
  const [selected, setSelected] = useState(() => new Set(role.permissions));
  const [error, setError] = useState<string | null>(null);
  const isParentRole = role.slug === "PARENT";

  const groups = useMemo(() => {
    const grouped = new Map<string, PermissionInfo[]>();
    for (const p of catalogue) {
      if (isPortalKey(p.key) && !isParentRole) continue;
      grouped.set(p.group, [...(grouped.get(p.group) ?? []), p]);
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [catalogue, isParentRole]);

  const canGrant = (key: string) => mine.includes(key);
  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const changed = selected.size !== role.permissions.length || role.permissions.some((k) => !selected.has(k));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await setPermissions.mutateAsync({ id: role.id, permissions: [...selected] });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title={`${role.name}: Permissions`} onClose={onClose} className="max-w-2xl">
      <form onSubmit={save} noValidate>
        <p className="text-xs text-slate-gray">
          Changes apply to all {role.memberCount} member{role.memberCount === 1 ? "" : "s"} with this role straight away. Greyed-out
          permissions are ones you don&apos;t hold yourself, so you can&apos;t give them out.
        </p>
        <div className="mt-4 space-y-4">
          {groups.map(([group, permissions]) => {
            const grantable = permissions.filter((p) => canGrant(p.key));
            const allOn = grantable.length > 0 && grantable.every((p) => selected.has(p.key));
            return (
              <fieldset key={group} className="rounded-lg border border-slate-gray/10 p-3">
                <legend className="flex w-full items-center justify-between gap-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-gray">{groupLabel(group)}</span>
                </legend>
                {grantable.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        for (const p of grantable) {
                          if (allOn) next.delete(p.key);
                          else next.add(p.key);
                        }
                        return next;
                      })
                    }
                    className="mb-1 text-[11px] font-semibold text-bright-blue hover:underline"
                  >
                    {allOn ? "Clear all" : "Select all"}
                  </button>
                )}
                <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {permissions.map((p) => {
                    const locked = !canGrant(p.key);
                    return (
                      <label key={p.key} className={cn("flex items-start gap-2 text-xs", locked ? "cursor-not-allowed text-slate-gray/60" : "cursor-pointer text-primary-navy")}>
                        <input
                          type="checkbox"
                          className="mt-0.5 h-3.5 w-3.5 accent-bright-blue"
                          checked={selected.has(p.key)}
                          disabled={locked}
                          onChange={() => toggle(p.key)}
                        />
                        {p.description}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
        <div className="mt-4">
          <FormError message={error} />
        </div>
        <Footer onClose={onClose} pending={setPermissions.isPending} label={`Save (${selected.size})`} disabled={!changed} />
      </form>
    </Modal>
  );
}

/** Delete a custom role. If anyone holds it, they're moved to another role first. */
export function DeleteRoleModal({ role, roles, onClose }: { role: Role; roles: Role[]; onClose: () => void }) {
  const reassign = useReassignRoleMembers();
  const remove = useDeleteRole();
  const targets = roles.filter((r) => r.id !== role.id && r.slug !== "PARENT");
  const [toRoleId, setToRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pending = reassign.isPending || remove.isPending;

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (role.memberCount > 0 && !toRoleId) return setError("Choose the role to move them to.");
    setError(null);
    try {
      if (role.memberCount > 0) await reassign.mutateAsync({ id: role.id, toRoleId });
      await remove.mutateAsync(role.id);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title="Delete Role" onClose={onClose}>
      <form onSubmit={confirm} noValidate className="space-y-4">
        {role.memberCount > 0 ? (
          <>
            <p className="text-sm text-slate-gray">
              <span className="font-semibold text-primary-navy">{role.name}</span> is held by {role.memberCount} member
              {role.memberCount === 1 ? "" : "s"} of staff. Move them to another role, then the role is deleted.
            </p>
            <SelectField label="Move them to *" value={toRoleId} onChange={(e) => setToRoleId(e.target.value)}>
              <option value="" disabled>
                Select a role
              </option>
              {targets.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </SelectField>
          </>
        ) : (
          <p className="text-sm text-slate-gray">
            Delete <span className="font-semibold text-primary-navy">{role.name}</span>? Nobody holds it, so no one is affected.
          </p>
        )}
        <FormError message={error} />
        <Footer onClose={onClose} pending={pending} label={role.memberCount > 0 ? "Move & Delete" : "Delete"} />
      </form>
    </Modal>
  );
}
