import type { Metadata } from "next";
import { AuthCard } from "../../components/auth/AuthCard";
import { RegisterSchoolForm } from "../../components/auth/RegisterSchoolForm";

export const metadata: Metadata = {
  title: "EduGear - Register Your School",
};

export default function RegisterPage() {
  return (
    <AuthCard wide>
      <RegisterSchoolForm />
    </AuthCard>
  );
}
