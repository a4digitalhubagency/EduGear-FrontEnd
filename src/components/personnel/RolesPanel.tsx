"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, Users } from "lucide-react";
import { LoadingText, Pill, RetryButton } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { usePermissionCatalogue, useRoles } from "@/lib/queries/school";
import { useCan } from "@/lib/store/auth-store";
import type { PermissionInfo, Role } from "@/types/school";

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
      {children}
    </div>
  );
}

/** "users" -> "Users", "school" -> "School". */
const groupLabel = (group: string) => group.charAt(0).toUpperCase() + group.slice(1).replaceAll("_", " ");

function RoleCard({ role, catalogue }: { role: Role; catalogue: Map<string, PermissionInfo> }) {
  const [open, setOpen] = useState(false);

  // Group the role's permissions by catalogue area, e.g. Students: view, create...
  const groups = useMemo(() => {
    const grouped = new Map<string, PermissionInfo[]>();
    for (const key of role.permissions) {
      const info = catalogue.get(key) ?? { key, group: key.split(".")[0], description: key };
      grouped.set(info.group, [...(grouped.get(info.group) ?? []), info]);
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [role.permissions, catalogue]);

  return (
    <div className="rounded-xl border border-slate-gray/10 bg-white">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cloud-sky text-bright-blue">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-2 font-bold text-primary-navy">
              {role.name}
              {role.isSystem && <Pill className="bg-slate-gray/10 text-slate-gray">System</Pill>}
            </p>
            {role.description && <p className="mt-0.5 text-xs text-slate-gray">{role.description}</p>}
            <p className="mt-1 flex items-center gap-3 text-xs text-slate-gray">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {role.memberCount} member{role.memberCount === 1 ? "" : "s"}
              </span>
              <span>
                {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-t border-slate-gray/10 px-4 py-2.5 text-xs font-semibold text-bright-blue hover:bg-cloud-sky/20"
      >
        {open ? "Hide permissions" : "View permissions"}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-gray/10 p-4">
          {groups.length === 0 ? (
            <p className="text-xs text-slate-gray">This role has no permissions.</p>
          ) : (
            groups.map(([group, permissions]) => (
              <div key={group}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-gray">{groupLabel(group)}</p>
                <ul className="mt-1 space-y-0.5">
                  {permissions.map((p) => (
                    <li key={p.key} className="text-xs text-primary-navy">
                      {p.description}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Roles tab: each role with its member count and what it allows, in plain language from
 * the permission catalogue. View-only for now; changing a role's permissions affects
 * everyone holding it at once, so editing is held back until it's been agreed.
 */
export function RolesPanel() {
  const canRead = useCan("roles.read");
  const roles = useRoles(canRead);
  const catalogue = usePermissionCatalogue(canRead);

  const catalogueByKey = useMemo(
    () => new Map((catalogue.data ?? []).map((p) => [p.key, p] as const)),
    [catalogue.data],
  );

  if (!canRead) return <StateCard>You don&apos;t have permission to view roles.</StateCard>;
  if (roles.isPending || catalogue.isPending) {
    return (
      <StateCard>
        <LoadingText label="Loading roles..." />
      </StateCard>
    );
  }
  if (roles.isError || catalogue.isError) {
    return (
      <StateCard>
        {errorMessage(roles.error ?? catalogue.error)}
        <RetryButton
          onRetry={() => {
            void roles.refetch();
            void catalogue.refetch();
          }}
        />
      </StateCard>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-gray">
        What each role can do. Changes to a role apply to everyone who holds it, and can take up to 30 seconds to
        reach them.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {roles.data.map((role) => (
          <RoleCard key={role.id} role={role} catalogue={catalogueByKey} />
        ))}
      </div>
    </div>
  );
}
