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