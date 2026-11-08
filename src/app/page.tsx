import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "EduGear - School Management Software for Nigerian Schools",
  description: "Admissions, attendance, results, fees and a parent portal in one place. Register your school on EduGear.",
};

export default function Home() {
  return <LandingPage />;
}
