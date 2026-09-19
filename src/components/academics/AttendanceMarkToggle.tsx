import type { AttendanceMark } from "@/types/attendance";

const MARKS: { value: AttendanceMark; label: string; activeClass: string }[] = [
  { value: "present", label: "P", activeClass: "bg-green-600 text-white" },
  { value: "absent", label: "A", activeClass: "bg-red-600 text-white" },
  { value: "late", label: "L", activeClass: "bg-amber-500 text-white" },
  { value: "excused", label: "E", activeClass: "bg-bright-blue text-white" },
];

interface AttendanceMarkToggleProps {
  value: AttendanceMark | null;
  onChange: (mark: AttendanceMark) => void;
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
          className={`h-8 w-8 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            value === mark.value
              ? mark.activeClass
              : "bg-white text-slate-gray hover:bg-cloud-sky/60"
          }`}
        >
          {mark.label}
        </button>
      ))}
    </div>
  );
}