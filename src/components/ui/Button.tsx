import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "tonal";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

/**
 * EduGear button component, matching the "Foundations & Buttons" screen
 * in the design system (Primary / Secondary / Ghost / Danger / Tonal).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", isLoading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          variant === "primary" &&
            "bg-primary-navy text-white hover:bg-primary-navy/90",
          variant === "secondary" &&
            "border border-bright-blue text-bright-blue hover:bg-cloud-sky",
          variant === "tonal" &&
            "bg-cloud-sky text-bright-blue hover:bg-cloud-sky/80",
          variant === "ghost" &&
            "text-bright-blue hover:bg-cloud-sky/60",
          variant === "danger" &&
            "bg-red-600 text-white hover:bg-red-700",
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";