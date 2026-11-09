"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { EduGearLogo } from "@/components/EduGearLogo";
import { useAuthStore } from "@/lib/store/auth-store";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Who it's for", href: "#roles" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const signedIn = useAuthStore((s) => s.ready && !!s.accessToken);
  const isParent = useAuthStore((s) => s.permissions.includes("portal.access"));
  const account = !signedIn
    ? { href: "/login", label: "Log in" }
    : isParent
      ? { href: "/portal", label: "Go to portal" }
      : { href: "/dashboard", label: "Go to dashboard" };

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" aria-label="EduGear home">
          <EduGearLogo variant="outline" withWordmark />
        </Link>
        <div className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-white/75 transition-colors hover:text-white">
              {link.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href={account.href} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
            {account.label}
          </Link>
          {!signedIn && (
            <Link href="/register" className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary-navy transition-colors hover:bg-cloud-sky">
              Register your school
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="mx-4 animate-dropdown-in rounded-2xl bg-white p-3 shadow-2xl lg:hidden">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-semibold text-primary-navy hover:bg-cloud-sky/60"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2 border-t border-slate-gray/10 pt-3">
            <Link href={account.href} className="flex-1 rounded-lg border border-bright-blue px-3 py-2.5 text-center text-sm font-semibold text-bright-blue">
              {account.label}
            </Link>
            {!signedIn && (
              <Link href="/register" className="flex-1 rounded-lg bg-primary-navy px-3 py-2.5 text-center text-sm font-semibold text-white">
                Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
