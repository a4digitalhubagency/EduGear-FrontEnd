import type { Metadata } from "next";
import { AuthCard } from "../../components/auth/AuthCard";
import { VerifyEmailView } from "../../components/auth/VerifyEmailView";

export const metadata: Metadata = {
  title: "EduGear - Verify Email",
};

/** Where verification emails link to: /verify-email?token=... */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;
  return (
    <AuthCard>
      <VerifyEmailView token={typeof token === "string" ? token : null} />
    </AuthCard>
  );
}
