import type { ReactNode } from "react";
import { EduGearLogo } from "../EduGearLogo";

interface AuthCardProps {
  children: ReactNode;
}

/**
 * Standalone centered-card layout for the secondary auth screens
 * (Forgot Password, Reset Password) — distinct from AuthShell's split
 * dark-panel/white-panel layout used on Login. The Stitch design system
 * renders these screens as a single centered white card with the brand
 * mark on top, not the two-panel layout.
 */
export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <EduGearLogo />
        </div>
        {children}
      </div>
    </div>
  );
}