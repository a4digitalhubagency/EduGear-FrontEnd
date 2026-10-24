import type { Metadata } from "next";
import { AuthCard } from "../../components/auth/AuthCard";
import { AcceptInvitationForm } from "../../components/auth/AcceptInvitationForm";

export const metadata: Metadata = {
  title: "EduGear - Accept Invitation",
};

/** Where staff and parent invitation emails link to: /accept-invitation?token=... */
export default async function AcceptInvitationPage({ searchParams }: PageProps<"/accept-invitation">) {
  const { token } = await searchParams;
  return (
    <AuthCard>
      <AcceptInvitationForm token={typeof token === "string" ? token : null} />
    </AuthCard>
  );
}
