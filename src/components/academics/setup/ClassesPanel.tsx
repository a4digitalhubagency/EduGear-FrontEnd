"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ArmFormModal } from "@/components/academics/setup/ArmFormModal";
import { ClassFormModal } from "@/components/academics/setup/ClassFormModal";
import { IconAction, LoadingText, RetryButton } from "@/components/academics/setup/shared";
import { errorMessage } from "@/lib/api-client";
import { useClassArms, useClasses, useDeleteClass, useDeleteClassArm } from "@/lib/queries/academics";
import { useCan } from "@/lib/store/auth-store";
import type { ClassArm, SchoolClass } from "@/types/academics";

type Editing =
  | { kind: "class"; schoolClass?: SchoolClass }
  | { kind: "arm"; schoolClass: SchoolClass; arm?: ClassArm };

type Deleting = { kind: "class"; schoolClass: SchoolClass } | { kind: "arm"; arm: ClassArm };

/** Card wrapper for the empty/loading/error states, same border as the cards themselves. */
function PanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-gray/10 bg-white px-4 py-10 text-center text-sm text-slate-gray">
      {children}
    </div>
  );
}

function enrolment(arm: ClassArm) {
  return arm.capacity ? `${arm.studentCount}/${arm.capacity} students` : `${arm.studentCount} students`;
}

export function ClassesPanel() {
  const classes = useClasses();
  const arms = useClassArms(); // every arm in the school, grouped per class below
  const deleteClass = useDeleteClass();
  const deleteArm = useDeleteClassArm();
  const canCreate = useCan("academics.create");
  const canUpdate = useCan("academics.update");
  const canDelete = useCan("academics.delete");

  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);

  const armsByClass = useMemo(() => {
    const grouped = new Map<string, ClassArm[]>();
    for (const arm of arms.data?.data ?? []) {
      grouped.set(arm.classId, [...(grouped.get(arm.classId) ?? []), arm]);
    }
    return grouped;
  }, [arms.data]);

  const classList = classes.data?.data ?? [];
  const nextLevel = classList.length ? Math.max(...classList.map((c) => c.level)) + 1 : 1;

  let body: React.ReactNode;
  if (classes.isPending || arms.isPending) {
    body = (
      <PanelMessage>
        <LoadingText label="Loading classes..." />
      </PanelMessage>
    );
  } else if (classes.isError || arms.isError) {
    body = (
      <PanelMessage>
        {errorMessage(classes.error ?? arms.error)}
        <RetryButton
          onRetry={() => {
            void classes.refetch();
            void arms.refetch();
          }}
        />
      </PanelMessage>
    );
  } else if (classList.length === 0) {
    body = <PanelMessage>No classes yet.{canCreate && " Add your first class, e.g. JSS1 at level 1."}</PanelMessage>;
  } else {
    body = (
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {classList.map((schoolClass) => {
          const classArms = armsByClass.get(schoolClass.id) ?? [];
          return (
            <div key={schoolClass.id} className="rounded-xl border border-slate-gray/10 bg-white">
              <div className="flex items-start justify-between gap-3 border-b border-slate-gray/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cloud-sky text-sm font-bold text-bright-blue">
                    {schoolClass.level}
                  </div>
                  <div>
                    <p className="font-bold text-primary-navy">{schoolClass.name}</p>
                    <p className="text-xs text-slate-gray">
                      Level {schoolClass.level} · {schoolClass.armCount} arm{schoolClass.armCount === 1 ? "" : "s"} ·{" "}
                      {schoolClass.studentCount} student{schoolClass.studentCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {canUpdate && (
                    <IconAction
                      icon={Pencil}
                      label={`Edit ${schoolClass.name}`}
                      onClick={() => setEditing({ kind: "class", schoolClass })}
                    />
                  )}
                  {canDelete && (
                    <IconAction
                      icon={Trash2}
                      label={`Delete ${schoolClass.name}`}
                      tone="danger"
                      onClick={() => setDeleting({ kind: "class", schoolClass })}
                      disabledReason={schoolClass.armCount > 0 ? "Delete this class's arms first." : null}
                    />
                  )}
                </div>
              </div>

              <ul className="divide-y divide-slate-gray/10">
                {classArms.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-slate-gray">No arms yet.</li>
                ) : (
                  classArms.map((arm) => (
                    <li key={arm.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-cloud-sky/20">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary-navy">{arm.fullName}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-gray">
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-3.5 w-3.5" />
                            {arm.formTeacherName ?? "No form teacher"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {enrolment(arm)}
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {canUpdate && (
                          <IconAction
                            icon={Pencil}
                            label={`Edit ${arm.fullName}`}
                            onClick={() => setEditing({ kind: "arm", schoolClass, arm })}
                          />
                        )}
                        {canDelete && (
                          <IconAction
                            icon={Trash2}
                            label={`Delete ${arm.fullName}`}
                            tone="danger"
                            onClick={() => setDeleting({ kind: "arm", arm })}
                            disabledReason={arm.studentCount > 0 ? "Move this arm's students out first." : null}
                          />
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>

              {canCreate && (
                <div className="border-t border-slate-gray/10 p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="py-2"
                    onClick={() => setEditing({ kind: "arm", schoolClass })}
                  >
                    <Plus className="h-4 w-4" />
                    Add Arm
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-gray">
          Classes are year groups (JSS1, SS2); arms are their streams (A, B, C), where students and form teachers sit.
        </p>
        {canCreate && (
          <Button type="button" className="w-auto px-4 py-2.5" onClick={() => setEditing({ kind: "class" })}>
            <Plus className="h-4 w-4" />
            New Class
          </Button>
        )}
      </div>

      {body}

      {editing?.kind === "class" && (
        <ClassFormModal
          schoolClass={editing.schoolClass}
          suggestedLevel={Math.min(nextLevel, 20)}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === "arm" && (
        <ArmFormModal schoolClass={editing.schoolClass} arm={editing.arm} onClose={() => setEditing(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          title={deleting.kind === "class" ? "Delete Class?" : "Delete Arm?"}
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-primary-navy">
                {deleting.kind === "class" ? deleting.schoolClass.name : deleting.arm.fullName}
              </span>
              ? This action cannot be undone.
            </>
          }
          onConfirm={() =>
            deleting.kind === "class"
              ? deleteClass.mutateAsync(deleting.schoolClass.id)
              : deleteArm.mutateAsync(deleting.arm.id)
          }
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
