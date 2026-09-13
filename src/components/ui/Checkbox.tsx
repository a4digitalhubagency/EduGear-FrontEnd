import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center gap-2 select-none"
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-slate-gray/40 text-bright-blue focus:ring-2 focus:ring-bright-blue/30",
            className,
          )}
          {...props}
        />
        <span className="text-sm text-slate-gray">{label}</span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";