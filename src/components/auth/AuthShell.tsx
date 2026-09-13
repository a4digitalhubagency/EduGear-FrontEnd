import type { ReactNode } from "react";
import { EduGearLogo } from "../EduGearLogo";

interface AuthShellProps {
  /** Left panel (dark navy) headline. */
  headline?: string;
  /** Left panel supporting copy under the headline. */
  subtext?: string;
  /** The form / content rendered in the right (white) panel. */
  children: ReactNode;
}

/**
 * Shared split-screen layout for the EduGear auth flow
 * (Login, Forgot Password, Reset Password).
 *
 * Left: dark "Primary Navy" brand panel with headline + supporting copy.
 * Right: white panel centering the page's own form content.
 */
export function AuthShell({
  headline = "Powering the Next Generation of Academic Excellence",
  subtext = "Designed for Nigeria's leading private institutions. A seamless, secure, and sophisticated operating system for school management.",
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary-navy px-12 py-12 text-white lg:flex">
        <EduGearLogo variant="outline" />

        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-balance">
            {headline}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {subtext}
          </p>
        </div>

        <p className="text-xs font-medium tracking-wide text-white/50">
          &copy; {new Date().getFullYear()} EduGear. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-1 items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}