"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, FileSpreadsheet, ImageIcon, Upload } from "lucide-react";
import { cn, formatNaira } from "@/lib/utils";

function Panel({ title, tag, children }: { title: string; tag: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-gray/10 bg-white p-5 shadow-xl shadow-primary-navy/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-primary-navy">{title}</p>
        <span className="rounded-full bg-cloud-sky px-2.5 py-1 text-[11px] font-semibold text-bright-blue">{tag}</span>
      </div>
      {children}
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-2.5 text-sm", strong ? "font-bold text-primary-navy" : "text-slate-gray")}>
      <span>{label}</span>
      <span className="font-semibold text-primary-navy">{value}</span>
    </div>
  );
}

const ImportPanel = (
  <Panel title="Bulk import students" tag="Validate">
    <div className="flex items-center gap-3 rounded-xl bg-cloud-sky/50 p-3">
      <FileSpreadsheet className="h-8 w-8 text-bright-blue" />
      <div>
        <p className="text-sm font-semibold text-primary-navy">students-2026.csv</p>
        <p className="text-xs text-slate-gray">Checked before anything is saved</p>
      </div>
    </div>
    <div className="mt-3 divide-y divide-slate-gray/10">
      <Line label="Rows checked" value="412" />
      <Line label="Ready to import" value="409" />
      <Line label="Need a correction" value="3" />
    </div>
  </Panel>
);

const FeesPanel = (
  <Panel title="JSS 1 First Term Fees" tag="Fee structure">
    <div className="divide-y divide-slate-gray/10">
      <Line label="Tuition" value={formatNaira(120_000)} />
      <Line label="Books" value={formatNaira(18_500)} />
      <Line label="Bus (optional)" value={formatNaira(35_000)} />
      <Line label="Compulsory total" value={formatNaira(138_500)} strong />
    </div>
    <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">Invoices issued to the class</p>
  </Panel>
);

const ProofPanel = (
  <div className="mx-auto max-w-xs rounded-[2rem] bg-primary-navy p-2.5 shadow-xl shadow-primary-navy/20">
    <div className="rounded-3xl bg-white p-4">
      <p className="text-xs text-slate-gray">Balance for Amina</p>
      <p className="text-2xl font-bold text-primary-navy">{formatNaira(45_000)}</p>
      <div className="mt-4 rounded-xl border-2 border-dashed border-bright-blue/30 bg-cloud-sky/40 p-4 text-center">
        <Upload className="mx-auto h-5 w-5 text-bright-blue" />
        <p className="mt-1.5 text-xs font-semibold text-primary-navy">bank-teller.jpg</p>
        <p className="text-[11px] text-slate-gray">Attached</p>
      </div>
      <p className="mt-3 rounded-lg bg-primary-navy py-2.5 text-center text-sm font-semibold text-white">I&apos;ve Paid</p>
    </div>
  </div>
);

const VerifyPanel = (
  <Panel title="Proof of payment" tag="Bursar">
    <div className="flex h-28 items-center justify-center rounded-xl bg-cloud-sky/50 text-bright-blue">
      <ImageIcon className="h-9 w-9" />
    </div>
    <div className="mt-3 divide-y divide-slate-gray/10">
      <Line label="Amina Bello" value={formatNaira(45_000)} />
      <Line label="Receipt" value="RCT-0412" />
    </div>
    <p className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-green-100 py-2.5 text-sm font-semibold text-green-800">
      <CheckCircle2 className="h-4 w-4" /> Verified, receipt issued
    </p>
  </Panel>
);

const RESULT_STAGES = ["Draft", "Submitted", "Approved", "Published"];

const ResultsPanel = (
  <Panel title="JSS 1 A, Mathematics" tag="Result sheet">
    <div className="divide-y divide-slate-gray/10">
      <Line label="Amina Bello" value="82" />
      <Line label="Tobi Adeyemi" value="74" />
      <Line label="Chidera Okafor" value="91" />
    </div>
    <ol className="mt-4 grid grid-cols-4 gap-1.5">
      {RESULT_STAGES.map((stage, i) => (
        <li key={stage}>
          <span className={cn("block h-1.5 rounded-full", i < 3 ? "bg-bright-blue" : "bg-cloud-sky")} />
          <span className={cn("mt-1.5 block text-[10px] font-semibold sm:text-[11px]", i < 3 ? "text-primary-navy" : "text-slate-gray")}>{stage}</span>
        </li>
      ))}
    </ol>
  </Panel>
);

const ReportPanel = (
  <Panel title="Report card" tag="Published">
    <div className="flex items-center gap-4 rounded-xl bg-primary-navy p-4 text-white">
      <p className="text-4xl font-bold">78.4%</p>
      <div>
        <p className="text-sm font-semibold">Amina Bello</p>
        <p className="text-xs text-white/70">3rd of 28 · First Term</p>
      </div>
    </div>
    <div className="mt-3 divide-y divide-slate-gray/10">
      <Line label="Mathematics" value="82" />
      <Line label="English Language" value="76" />
      <Line label="Basic Science" value="77" />
    </div>
    <p className="mt-3 text-center text-xs font-semibold text-bright-blue">Visible to the parent in their portal</p>
  </Panel>
);

const STEPS = [
  {
    when: "Resumption",
    title: "Bring your students in, once.",
    body: "Upload the list you already keep as a CSV. EduGear checks every row first and tells you exactly which ones need fixing.",
    panel: ImportPanel,
  },
  {
    when: "Week 1",
    title: "Set the fees. Every child is billed.",
    body: "Build a fee structure for a class or the whole school, mark extras like the bus as optional, and issue the invoices.",
    panel: FeesPanel,
  },
  {
    when: "Week 2",
    title: "Parents send proof from their phone.",
    body: "No more tellers lost in a school bag. A parent attaches the slip or transfer screenshot in their portal and it goes straight to the bursar.",
    panel: ProofPanel,
  },
  {
    when: "Then",
    title: "The bursar checks it. The receipt appears.",
    body: "The proof sits right beside the payment. Once it's verified, the balance updates and a numbered receipt is issued.",
    panel: VerifyPanel,
  },
  {
    when: "Exams",
    title: "Scores move through proper approval.",
    body: "Teachers enter scores and submit. Results are approved before they are published, so nothing reaches a parent by accident.",
    panel: ResultsPanel,
  },
  {
    when: "End of term",
    title: "Report cards, without the long night.",
    body: "Averages and positions come out of the scores you already entered. Publish, print with your school's logo, and parents see them right away.",
    panel: ReportPanel,
  },
];

/** One term told as you scroll: the steps move on the left while the product panel changes beside them. */
export function TermStory() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // A thin band across the middle of the screen: whichever step crosses it is the current one.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
      <ol>
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            data-index={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            className="relative border-l-2 border-cloud-sky py-8 pl-7 lg:flex lg:min-h-[58vh] lg:flex-col lg:justify-center lg:py-0"
          >
            <span
              aria-hidden
              className={cn(
                "absolute -left-[9px] top-9 h-4 w-4 rounded-full border-4 border-white transition-colors duration-300 lg:top-1/2 lg:-translate-y-1/2",
                i <= active ? "bg-bright-blue" : "bg-cloud-sky",
              )}
            />
            <div className={cn("transition-opacity duration-300", i === active ? "opacity-100" : "lg:opacity-40")}>
              <p className="text-sm font-semibold text-bright-blue">{step.when}</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-primary-navy sm:text-3xl">{step.title}</h3>
              <p className="mt-3 max-w-md leading-relaxed text-slate-gray">{step.body}</p>
            </div>
            <div className="mt-6 lg:hidden">{step.panel}</div>
          </li>
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[calc(50vh-13rem)]">
          <div key={active} className="animate-fade-in-up">
            {STEPS[active].panel}
          </div>
        </div>
      </div>
    </div>
  );
}
