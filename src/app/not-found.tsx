import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EduGearLogo } from "@/components/EduGearLogo";

export const metadata: Metadata = { title: "EduGear - Page Not Found" };

/** Any address that doesn't exist. Log in forwards people who are already signed in to their dashboard. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cloud-sky/40 px-6 text-center">
      <Link href="/" aria-label="EduGear home">
        <EduGearLogo />
      </Link>
      <p className="mt-10 text-sm font-semibold text-bright-blue">404</p>
      <h1 className="mt-2 text-3xl font-bold text-primary-navy">We can&apos;t find that page</h1>
      <p className="mt-3 max-w-md text-slate-gray">The link may be old or mistyped. Check the address, or head back to a page you know.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-navy px-5 py-3 text-sm font-semibold text-white hover:bg-primary-navy/90">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <Link href="/login" className="rounded-lg border border-bright-blue px-5 py-3 text-center text-sm font-semibold text-bright-blue hover:bg-cloud-sky">
          Log in
        </Link>
      </div>
    </div>
  );
}
