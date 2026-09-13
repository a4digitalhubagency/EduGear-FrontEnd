import type { Metadata } from "next";
import { AuthCard } from "../../components/auth/AuthCard";
import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "EduGear - Reset Password",
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  return (
    <AuthCard>
      <ResetPasswordForm token={typeof token === "string" ? token : null} />
    </AuthCard>
  );
}