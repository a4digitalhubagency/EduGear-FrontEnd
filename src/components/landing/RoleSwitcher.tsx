"use client";

import { useState } from "react";
import { BookOpenCheck, Check, Crown, Users, Wallet, type LucideIcon } from "lucide-react";
import { cn, formatNaira } from "@/lib/utils";

type Role = {
  label: string;
  icon: LucideIcon;
  headline: string;
  points: string[];
  previewTitle: string;
  preview: { label: string; value: string }[];
};

const ROLES: Role[] = [
  {
    label: "Proprietor",
    icon: Crown,
    headline: "Know how the school is doing without asking anyone.",
    points: ["Enrolment, attendance and money on one dashboard", "Invite staff and give each person the right role", "Your logo and details on every receipt and report card"],
    previewTitle: "Today at a glance",
    preview: [
      { label: "Active students", value: "642" },
      { label: "Collected this term", value: formatNaira(4_326_000) },
      { label: "Outstanding", value: formatNaira(1_180_500) },
    ],
  },
  {
    label: "Bursar",
    icon: Wallet,
    headline: "Every naira has a name, a date and a receipt.",
    points: ["Fee structures, invoices, discounts and waivers", "Record payments and verify parents' proofs", "Numbered receipts ready to print"],
    previewTitle: "Waiting for you",
    preview: [
      { label: "Proofs to verify", value: "7" },
      { label: "Verified today", value: "23" },
      { label: "Receipts issued", value: "23" },
    ],
  },
  {
    label: "Teacher",
    icon: BookOpenCheck,
    headline: "Mark the register and enter scores, then get back to teaching.",
    points: ["Take attendance for your class", "Enter scores subject by subject", "Submit results for approval when they're ready"],
    previewTitle: "JSS 1 A today",
    preview: [
      { label: "Present", value: "26" },
      { label: "Absent", value: "2" },
      { label: "Scores left to enter", value: "4" },
    ],
  },
  {
    label: "Parent",
    icon: Users,
    headline: "Fees, results and attendance, right on their phone.",
    points: ["See exactly what is owed and what has been paid", "Send proof of payment without visiting the school", "Open published results for each child"],
    previewTitle: "Amina, JSS 1 A",
    preview: [
      { label: "Fee balance", value: "All paid" },
      { label: "Attendance", value: "96%" },
      { label: "Latest average", value: "78.4%" },
    ],
  },
];

/** Each person in the school gets their own view of the same records. */
export function RoleSwitcher() {
  const [active, setActive] = useState(0);
  const role = ROLES[active];

  return (
    <div>
      <div role="tablist" aria-label="School roles" className="grid grid-cols-2 gap-2 sm:flex">
        {ROLES.map((r, i) => (
          <button
            key={r.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-200",
              i === active ? "bg-white text-primary-navy" : "bg-white/10 text-white hover:bg-white/15",
            )}
          >
            <r.icon className="h-4 w-4" />
            {r.label}
          </button>
        ))}
      </div>

      <div key={role.label} role="tabpanel" className="mt-8 grid animate-fade-in-up items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{role.headline}</h3>
          <ul className="mt-6 space-y-3">
            {role.points.map((point) => (
              <li key={point} className="flex gap-3 text-white/80">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-cloud-sky" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-primary-navy">{role.previewTitle}</p>
            <span className="rounded-full bg-cloud-sky px-2.5 py-1 text-[11px] font-semibold text-bright-blue">Sample data</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {role.preview.map((item) => (
              <div key={item.label} className="rounded-xl bg-cloud-sky/50 p-4">
                <p className="text-xs text-slate-gray">{item.label}</p>
                <p className="mt-2 text-xl font-bold text-primary-navy">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
