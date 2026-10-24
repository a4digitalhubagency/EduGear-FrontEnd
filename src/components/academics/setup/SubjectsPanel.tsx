"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { IconAction, LoadingText, Pill, RetryButton, TABLE_CARD, TABLE_HEAD_ROW, TABLE_ROW, TableStateRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/api-client";
import { useClasses } from "@/lib/queries/academics";
import {
  useClassSubjects,
  useCreateSubject,
  useDeleteSubject,
  useOfferSubject,
  useSetCompulsory,
  useSetSubjectTeacher,
  useSubjects,
  useUpdateSubject,
  useWithdrawSubject,
} from "@/lib/queries/results";
import { useActiveStaff } from "@/lib/queries/users";
import { useCan } from "@/lib/store/auth-store";
import type { ClassSubject, Subject } from "@/types/results";

const CODE_PATTERN = /^[A-Z0-9]{2,8}$/;

function SubjectFormModal({ subject, onClose }: { subject?: Subject; onClose: () => void }) {
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const [name, setName] = useState(subject?.name ?? "");
  const [code, setCode] = useState(subject?.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!name.trim()) return setError("Give the subject a name, e.g. Mathematics.");
    if (!CODE_PATTERN.test(cleanCode)) return setError("The code must be 2–8 letters or digits, e.g. MTH.");
    setError(null);
    try {
      if (subject) await update.mutateAsync({ id: subject.id, input: { name: name.trim(), code: cleanCode } });
      else await create.mutateAsync({ name: name.trim(), code: cleanCode });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal title={subject ? "Edit Subject" : "New Subject"} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Input label="Subject Name *" placeholder="e.g. Mathematics" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <Input
            label="Code *"
            placeholder="e.g. MTH"
            maxLength={8}
            className="uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-slate-gray">Shown on report cards. 2–8 letters or digits.</p>
        </div>
        <FormError message={error} />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="w-auto flex-1" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" className="w-auto flex-1" isLoading={pending}>
            {subject ? "Save Changes" : "Create Subject"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** The subjects a class offers, compulsory or elective, and who teaches each one in each arm. */
function ClassSubjectsSection({ subjects }: { subjects: Subject[] }) {
  const canUpdate = useCan("academics.update");
  const canPickTeacher = useCan("users.read");
  const classes = useClasses();
  const classList = classes.data?.data ?? [];
  const [picked, setPicked] = useState<string | null>(null);
  const classId = picked ?? classList[0]?.id;
  const offered = useClassSubjects(classId);
  const staff = useActiveStaff(canPickTeacher && canUpdate);
  const offer = useOfferSubject();
  const setCompulsory = useSetCompulsory();
  const setTeacher = useSetSubjectTeacher();
  const withdraw = useWithdrawSubject();

  const [adding, setAdding] = useState("");
  const [addCompulsory, setAddCompulsory] = useState(true);
  const [withdrawing, setWithdrawing] = useState<ClassSubject | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offeredRows = offered.data ?? [];
  const available = subjects.filter((s) => s.isActive && !offeredRows.some((o) => o.subjectId === s.id));
  const armNames = offeredRows[0]?.teachers.map((t) => t.armName) ?? [];
  const staffList = staff.data?.data ?? [];

  function run(action: Promise<unknown>) {
    setError(null);
    action.catch((err) => setError(errorMessage(err)));
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-primary-navy">Subjects by Class</h2>
          <p className="text-xs text-slate-gray">
            What each class takes, and the subject teacher in each arm (the teacher who enters its scores).
          </p>
        </div>
        <Select value={classId ?? ""} onChange={(e) => setPicked(e.target.value)} aria-label="Class" disabled={classList.length === 0}>
          {classList.length === 0 && <option value="">No classes yet</option>}
          {classList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}

      <div className={`mt-4 ${TABLE_CARD}`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Type</th>
              {armNames.map((arm) => (
                <th key={arm} className="px-4 py-3">
                  Arm {arm} Teacher
                </th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!classId ? (
              <TableStateRow colSpan={3}>Add classes in the Classes &amp; Arms tab first.</TableStateRow>
            ) : offered.isPending ? (
              <TableStateRow colSpan={3}>
                <LoadingText label="Loading..." />
              </TableStateRow>
            ) : offered.isError ? (
              <TableStateRow colSpan={3}>
                {errorMessage(offered.error)}
                <RetryButton onRetry={() => offered.refetch()} />
              </TableStateRow>
            ) : offeredRows.length === 0 ? (
              <TableStateRow colSpan={3}>This class doesn&apos;t offer any subjects yet. Add them below.</TableStateRow>
            ) : (
              offeredRows.map((cs) => (
                <tr key={cs.subjectId} className={TABLE_ROW}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary-navy">{cs.name}</p>
                    <p className="text-xs text-slate-gray">{cs.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    {canUpdate ? (
                      <Select
                        value={cs.isCompulsory ? "C" : "E"}
                        onChange={(e) => run(setCompulsory.mutateAsync({ classId: classId!, subjectId: cs.subjectId, isCompulsory: e.target.value === "C" }))}
                        aria-label={`${cs.name} type`}
                      >
                        <option value="C">Compulsory</option>
                        <option value="E">Elective</option>
                      </Select>
                    ) : (
                      <span className="text-slate-gray">{cs.isCompulsory ? "Compulsory" : "Elective"}</span>
                    )}
                  </td>
                  {cs.teachers.map((t) => (
                    <td key={t.classArmId} className="px-4 py-3">
                      {canUpdate && canPickTeacher ? (
                        <Select
                          value={t.teacherMembershipId ?? ""}
                          onChange={(e) =>
                            run(setTeacher.mutateAsync({ classArmId: t.classArmId, subjectId: cs.subjectId, teacherMembershipId: e.target.value || null }))
                          }
                          aria-label={`${cs.name}, arm ${t.armName} teacher`}
                          className="max-w-48"
                        >
                          <option value="">No teacher</option>
                          {t.teacherMembershipId && !staffList.some((m) => m.membershipId === t.teacherMembershipId) && (
                            <option value={t.teacherMembershipId}>{t.teacherName ?? "Current teacher"}</option>
                          )}
                          {staffList.map((m) => (
                            <option key={m.membershipId} value={m.membershipId}>
                              {m.firstName} {m.lastName}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <span className="text-slate-gray">{t.teacherName ?? "—"}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {canUpdate && (
                        <IconAction icon={Trash2} label={`Stop offering ${cs.name}`} tone="danger" onClick={() => setWithdrawing(cs)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {canUpdate && classId && (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-gray/10 p-3">
            <Select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Subject to add" disabled={available.length === 0}>
              <option value="">{available.length === 0 ? "Every active subject is offered" : "Add a subject..."}</option>
              {available.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </Select>
            <Checkbox id="add-compulsory" label="Compulsory" checked={addCompulsory} onChange={(e) => setAddCompulsory(e.target.checked)} />
            <Button
              type="button"
              variant="tonal"
              className="w-auto px-3 py-2"
              disabled={!adding}
              isLoading={offer.isPending}
              onClick={() => {
                run(offer.mutateAsync({ classId, subjectId: adding, isCompulsory: addCompulsory }));
                setAdding("");
              }}
            >
              <Plus className="h-4 w-4" />
              Add to Class
            </Button>
          </div>
        )}
      </div>

      {withdrawing && classId && (
        <ConfirmDialog
          title="Stop Offering Subject?"
          description={
            <>
              Remove <span className="font-semibold text-primary-navy">{withdrawing.name}</span> from this class? This isn&apos;t
              possible once scores have been entered for it.
            </>
          }
          confirmLabel="Remove"
          onConfirm={() => withdraw.mutateAsync({ classId, subjectId: withdrawing.subjectId })}
          onClose={() => setWithdrawing(null)}
        />
      )}
    </div>
  );
}

/**
 * Subjects tab of Academic Setup: the school's subject catalogue, then which classes take
 * which subjects and who teaches each in each arm. The subject teacher is the one person
 * (besides the principal) who may enter that subject's scores for that arm.
 */
export function SubjectsPanel() {
  const canCreate = useCan("academics.create");
  const canUpdate = useCan("academics.update");
  const canDelete = useCan("academics.delete");
  const subjects = useSubjects();
  const update = useUpdateSubject();
  const remove = useDeleteSubject();
  const [editing, setEditing] = useState<Subject | "new" | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rows = subjects.data?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-gray">Every subject taught in the school. Retire one to stop using it while keeping its results.</p>
        {canCreate && (
          <Button type="button" className="w-auto px-4 py-2.5" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            New Subject
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}

      <div className={`mt-4 ${TABLE_CARD}`}>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_ROW}>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Classes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.isPending ? (
              <TableStateRow colSpan={5}>
                <LoadingText label="Loading subjects..." />
              </TableStateRow>
            ) : subjects.isError ? (
              <TableStateRow colSpan={5}>
                {errorMessage(subjects.error)}
                <RetryButton onRetry={() => subjects.refetch()} />
              </TableStateRow>
            ) : rows.length === 0 ? (
              <TableStateRow colSpan={5}>No subjects yet.{canCreate && " Add the subjects your school teaches."}</TableStateRow>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className={TABLE_ROW}>
                  <td className="px-4 py-3 font-semibold text-primary-navy">{s.name}</td>
                  <td className="px-4 py-3 text-slate-gray">{s.code}</td>
                  <td className="px-4 py-3 text-slate-gray">{s.classCount}</td>
                  <td className="px-4 py-3">
                    {s.isActive ? <Pill className="bg-green-100 text-green-700">Active</Pill> : <Pill className="bg-slate-gray/10 text-slate-gray">Retired</Pill>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {canUpdate && <IconAction icon={Pencil} label={`Edit ${s.name}`} onClick={() => setEditing(s)} />}
                      {canUpdate && (
                        <IconAction
                          icon={s.isActive ? Archive : ArchiveRestore}
                          label={s.isActive ? `Retire ${s.name}` : `Restore ${s.name}`}
                          onClick={() => {
                            setError(null);
                            update.mutateAsync({ id: s.id, input: { isActive: !s.isActive } }).catch((err) => setError(errorMessage(err)));
                          }}
                        />
                      )}
                      {canDelete && (
                        <IconAction
                          icon={Trash2}
                          label={`Delete ${s.name}`}
                          tone="danger"
                          onClick={() => setDeleting(s)}
                          disabledReason={s.classCount > 0 ? "Offered by a class. Remove it from those classes first." : null}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ClassSubjectsSection subjects={rows} />

      {editing && <SubjectFormModal subject={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete Subject?"
          description={
            <>
              Delete <span className="font-semibold text-primary-navy">{deleting.name}</span>? If it already has results, retire it
              instead.
            </>
          }
          onConfirm={() => remove.mutateAsync(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
