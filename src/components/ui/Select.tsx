import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Compact filter dropdown — used in table toolbars (e.g. the Students List View filter row). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "appearance-none rounded-lg border border-slate-gray/25 bg-white py-2.5 pl-3 pr-8 text-sm text-primary-navy focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-gray/60" />
      </div>
    );
  },
);

Select.displayName = "Select";

interface SelectFieldProps extends SelectProps {
  label: string;
  error?: string;
}

/** Full-width form Select with a label and error line, matching Input's (as hand-built in GuardianFormModal). */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="w-full">
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold text-primary-navy">
          {label}
        </label>
        <Select
          ref={ref}
          id={selectId}
          className={cn("w-full py-3", error && "border-red-500 focus:border-red-500 focus:ring-red-500/20", className)}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  },
);

SelectField.displayName = "SelectField";