import type { Metadata } from "next";
import { AuthCard } from "../../../components/auth/AuthCard";
import { PlatformLoginForm } from "../../../components/platform/PlatformLoginForm";

export const metadata: Metadata = { title: "EduGear - Platform Sign In", robots: { index: false } };

export default async function PlatformLoginPage({ searchParams }: PageProps<"/platform/login">) {
  const { expired } = await searchParams;
  return (
    <AuthCard>
      <PlatformLoginForm expired={expired === "1"} />
    </AuthCard>
  );
}
