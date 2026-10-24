import type { AttendanceStatus } from "@/types/attendance";

const MARKS: { value: AttendanceStatus; label: string; title: string; activeClass: string }[] = [
  { value: "PRESENT", label: "P", title: "Present", activeClass: "bg-green-600 text-white" },
  { value: "ABSENT", label: "A", title: "Absent", activeClass: "bg-red-600 text-white" },
  { value: "LATE", label: "L", title: "Late", activeClass: "bg-amber-500 text-white" },
  { value: "EXCUSED", label: "E", title: "Excused", activeClass: "bg-bright-blue text-white" },
];

interface AttendanceMarkToggleProps {
  value: AttendanceStatus | null;
  onChange: (mark: AttendanceStatus) => void;
  disabled?: boolean;
}

/** Present/Absent/Late/Excused segmented control for one student's row on the Attendance Register. */
export function AttendanceMarkToggle({ value, onChange, disabled }: AttendanceMarkToggleProps) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-gray/20">
      {MARKS.map((mark) => (
        <button
          key={mark.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(mark.value)}
          aria-pressed={value === mark.value}
          aria-label={mark.title}
          title={mark.title}
          className={`h-8 w-8 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            value === mark.value ? mark.activeClass : "bg-white text-slate-gray hover:bg-cloud-sky/60"
          }`}
        >
          {mark.label}
        </button>
      ))}
    </div>
  );
}
