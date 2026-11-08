"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, FileText, Paperclip } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";
import { cn, formatNaira } from "@/lib/utils";

const STEP_MS = 2400;
const BASE_COLLECTED = 4_180_500;
const BARS = [42, 58, 49, 71, 64, 86];

// Illustrative figures only; the panel is labelled "Sample data".
const PAYMENTS = [
  { name: "Amina Bello", className: "JSS 1 A", amount: 45_000, receipt: "RCT-0412" },
  { name: "Tobi Adeyemi", className: "JSS 2 B", amount: 62_500, receipt: "RCT-0413" },
  { name: "Chidera Okafor", className: "SS 1 A", amount: 38_000, receipt: "RCT-0414" },
];

/** The hero's moving picture of the product: parents' proofs arrive and the bursar clears them one by one. */
export function HeroConsole() {
  const [verified, setVerified] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setVerified((n) => (n >= PAYMENTS.length ? 0 : n + 1)), STEP_MS);
    return () => window.clearInterval(timer);
  }, []);

  const collected = BASE_COLLECTED + PAYMENTS.slice(0, verified).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="relative mx-auto w-full max-w-xl" aria-label="Illustration of the EduGear finance screen, with sample data" role="img">
      <div className="rounded-2xl bg-white p-4 text-primary-navy shadow-2xl shadow-black/40 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Fees this term</p>
          <span className="rounded-full bg-cloud-sky px-2.5 py-1 text-[11px] font-semibold text-bright-blue">Sample data</span>
        </div>

        <div className="mt-4 grid grid-cols-5 items-end gap-4">
          <div className="col-span-3">
            <p className="text-xs text-slate-gray">Collected and verified</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">
              <CountUp value={formatNaira(collected)} />
            </p>
          </div>
          <div className="col-span-2 flex h-14 items-end gap-1.5">
            {BARS.map((height, i) => (
              <span
                key={i}
                className={cn("flex-1 origin-bottom animate-grow-y rounded-t", i === BARS.length - 1 ? "bg-bright-blue" : "bg-cloud-sky")}
                style={{ height: `${height}%`, animationDelay: `${i * 70}ms` }}
              />
            ))}
          </div>
        </div>

        <ul className="mt-4 divide-y divide-slate-gray/10 rounded-xl border border-slate-gray/10">
          {PAYMENTS.map((p, i) => {
            const done = i < verified;
            return (
              <li key={p.name} className={cn("flex items-center justify-between gap-3 px-3 py-2.5 transition-colors duration-300", i === verified && "bg-cloud-sky/50")}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-gray">
                    {p.className}
                    <span aria-hidden>·</span>
                    {done ? p.receipt : (
                      <>
                        <Paperclip className="h-3 w-3" /> Proof attached
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="hidden text-sm font-semibold sm:block">{formatNaira(p.amount)}</p>
                  <span
                    className={cn(
                      "inline-flex w-[84px] items-center justify-center gap-1 rounded-full py-1 text-[11px] font-semibold transition-colors duration-300",
                      done ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {done && <CheckCircle2 className="h-3 w-3" />}
                    {done ? "Verified" : "Pending"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* What the same moment looks like from the parent's phone. */}
      <div className="absolute -bottom-16 -left-4 hidden w-56 rounded-xl bg-white p-3 text-primary-navy shadow-xl shadow-black/30 sm:block lg:-left-12">
        <div className="flex items-start gap-2.5">
          <span className="rounded-lg bg-cloud-sky p-2 text-bright-blue">
            <Bell className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold">{verified > 0 ? "Payment confirmed" : "Waiting for the school"}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-gray">
              {verified > 0 ? `Receipt ${PAYMENTS[verified - 1].receipt} is ready to view.` : "Your proof of payment was sent."}
            </p>
          </div>
        </div>
      </div>
      <div className="absolute -right-3 -top-7 hidden items-center gap-2 rounded-xl bg-bright-blue px-3 py-2.5 text-white shadow-xl shadow-black/30 sm:flex lg:-right-8">
        <FileText className="h-4 w-4" />
        <p className="text-xs font-semibold">First Term report cards published</p>
      </div>
    </div>
  );
}
