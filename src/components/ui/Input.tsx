"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  /** Extra element rendered at the top-right of the label row (e.g. a "Forgot password?" link). */
  labelAction?: React.ReactNode;
}

/**
 * EduGear text input: label + left icon + error state.
 * Matches the "Inputs & Selection" screen in the design system.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon: Icon, error, labelAction, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="w-full">
        {(label || labelAction) && (
          <div className="mb-1.5 flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className="text-sm font-semibold text-primary-navy"
              >
                {label}
              </label>
            )}
            {labelAction}
          </div>
        )}

        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-gray/60" />
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border border-slate-gray/25 bg-white py-3 text-sm text-primary-navy placeholder:text-slate-gray/50 focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20",
              Icon ? "pl-10 pr-3" : "px-3",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              className,
            )}
            {...props}
          />
        </div>

        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

type PasswordInputProps = Omit<InputProps, "type">;

/** Password input with a show/hide toggle (lock icon + eye icon), as seen on the Login/Reset screens. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, labelAction, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? props.name;

    return (
      <div className="w-full">
        {(label || labelAction) && (
          <div className="mb-1.5 flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className="text-sm font-semibold text-primary-navy"
              >
                {label}
              </label>
            )}
            {labelAction}
          </div>
        )}

        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-gray/60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "w-full rounded-lg border border-slate-gray/25 bg-white py-3 pl-10 pr-10 text-sm text-primary-navy placeholder:text-slate-gray/50 focus:border-bright-blue focus:outline-none focus:ring-2 focus:ring-bright-blue/20",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray/60 hover:text-primary-navy"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>

        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";