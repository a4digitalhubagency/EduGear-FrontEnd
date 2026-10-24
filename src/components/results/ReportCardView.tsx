"use client";

import { useFileUrl } from "@/lib/queries/files";
import { formatDate } from "@/lib/utils";
import type { ReportCard } from "@/types/results";

const TERM_WORD: Record<string, string> = { FIRST: "First", SECOND: "Second", THIRD: "Third" };

/**
 * One printable report card from the backend's ReportCardDto: letterhead, student,
 * subject scores by component with grade, position and class figures, the summary,
 * attendance, comments and the grade key. Anything not yet published says PROVISIONAL.
 * No Stitch design exists, so it follows the receipt's printable layout.
 */
export function ReportCardView({ card }: { card: ReportCard }) {
  const logo = useFileUrl(card.school.logoUrl);
  const components = card.subjects[0]?.components ?? [];
  const showClassFigures = card.subjects.some((s) => s.classAverage !== null);
  const provisional = card.status !== "PUBLISHED";

  return (
    <article className="relative break-after-page bg-white p-6 text-primary-navy">
      {provisional && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-widest text-amber-700">
          Provisional · {card.status.toLowerCase()}, not yet published
        </p>
      )}

      <header className="flex items-start gap-4 border-b border-slate-gray/15 pb-4">
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element -- object/blob URLs can't go through next/image
          <img src={logo} alt="" className="h-16 w-16 object-contain" />
        )}
        <div className="flex-1">
          <p className="text-lg font-bold">{card.school.name}</p>
          {card.school.motto && <p className="text-xs italic text-slate-gray">{card.school.motto}</p>}
          <p className="mt-1 text-xs text-slate-gray">{[card.school.addressLine, card.school.city, card.school.state].filter(Boolean).join(", ")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold uppercase tracking-wide">Report Card</p>
          <p className="text-xs text-slate-gray">
            {TERM_WORD[card.termName] ?? card.termName} Term, {card.sessionName}
          </p>
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-gray">Student</dt>
          <dd className="font-semibold">{card.student.fullName}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-gray">Admission No.</dt>
          <dd className="font-semibold">{card.student.admissionNumber}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-gray">Class</dt>
          <dd className="font-semibold">{card.className}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-gray">Position</dt>
          <dd className="font-semibold">{card.positionLabel ? `${card.positionLabel} of ${card.outOf}` : "—"}</dd>
        </div>
      </dl>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-gray/20 text-[10px] font-semibold uppercase tracking-wide text-slate-gray">
              <th className="py-2 pr-2">Subject</th>
              {components.map((c) => (
                <th key={c.name} className="px-1 py-2 text-center">
                  {c.name} ({c.maxScore})
                </th>
              ))}
              <th className="px-1 py-2 text-center">Total</th>
              <th className="px-1 py-2 text-center">Grade</th>
              <th className="px-1 py-2 text-center">Pos.</th>
              {showClassFigures && <th className="px-1 py-2 text-center">Class Avg.</th>}
              <th className="py-2 pl-2">Remark</th>
            </tr>
          </thead>
          <tbody>
            {card.subjects.map((s) => (
              <tr key={s.subjectName} className="border-b border-slate-gray/10">
                <td className="py-1.5 pr-2 font-semibold">{s.subjectName}</td>
                {s.components.map((c) => (
                  <td key={c.name} className="px-1 py-1.5 text-center">
                    {c.score ?? "—"}
                  </td>
                ))}
                <td className="px-1 py-1.5 text-center font-semibold">{s.total}</td>
                <td className="px-1 py-1.5 text-center font-semibold">{s.grade ?? "—"}</td>
                <td className="px-1 py-1.5 text-center">{s.positionLabel ?? "—"}</td>
                {showClassFigures && <td className="px-1 py-1.5 text-center">{s.classAverage ?? "—"}</td>}
                <td className="py-1.5 pl-2 text-slate-gray">{s.remark ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {[
          ["Total Score", card.totalScore],
          ["Average", `${card.averageScore.toFixed(1)}%`],
          ["Subjects Passed", `${card.passes} of ${card.subjectCount}`],
          ["Attendance", card.attendance ? `${card.attendance.present} of ${card.attendance.daysOpen} days` : "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md bg-cloud-sky/30 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-gray">{label}</p>
            <p className="font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <p>
          <span className="font-semibold">Form teacher{card.formTeacherName ? ` (${card.formTeacherName})` : ""}:</span>{" "}
          <span className="text-slate-gray">{card.formTeacherComment ?? "—"}</span>
        </p>
        <p>
          <span className="font-semibold">Principal:</span> <span className="text-slate-gray">{card.principalComment ?? "—"}</span>
        </p>
        {card.nextTermBegins && <p className="text-xs text-slate-gray">Next term begins {formatDate(card.nextTermBegins)}.</p>}
      </div>

      {card.gradeScale.length > 0 && (
        <p className="mt-4 border-t border-slate-gray/10 pt-2 text-[10px] text-slate-gray">
          Grade key: {card.gradeScale.map((b) => `${b.grade} ${b.minScore}–${b.maxScore} ${b.remark}`).join(" · ")}
        </p>
      )}
    </article>
  );
}
