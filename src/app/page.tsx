import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "EduGear - School Management Software for Nigerian Schools",
  description: "Admissions, attendance, results, fees and a parent portal in one place. Register your school on EduGear.",
  alternates: { canonical: "/" },
  // What WhatsApp and social apps show when the link is shared; the image is app/opengraph-image.png.
  openGraph: {
    type: "website",
    url: "/",
    siteName: "EduGear",
    title: "EduGear - The school office, without the paper chase",
    description: "Admissions, attendance, results, fees and a parent portal in one place.",
  },
  twitter: { card: "summary_large_image" },
};

export default function Home() {
  return <LandingPage />;
}
