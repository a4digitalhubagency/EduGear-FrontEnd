import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { PlatformConfirmEmailView } from "@/components/platform/PlatformConfirmEmailView";

export const metadata: Metadata = { title: "EduGear - Confirm Platform Email", robots: { index: false } };

/** Where the backend's operator email-change link points: /platform/confirm-email?token=... */
export default async function PlatformConfirmEmailPage({ searchParams }: PageProps<"/platform/confirm-email">) {
  const { token } = await searchParams;
  return (
    <AuthCard>
      <PlatformConfirmEmailView token={typeof token === "string" ? token : null} />
    </AuthCard>
  );
}
