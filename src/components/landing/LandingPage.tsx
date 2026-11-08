import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  ClipboardList,
  FileCheck2,
  KeyRound,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Smartphone,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { EduGearLogo } from "@/components/EduGearLogo";
import { CONTACT, DEMO_VIDEO_URL, PLANS, SOCIALS } from "@/components/landing/content";
import { HeroConsole } from "@/components/landing/HeroConsole";
import { LandingNav } from "@/components/landing/LandingNav";
import { RoleSwitcher } from "@/components/landing/RoleSwitcher";
import { TermStory } from "@/components/landing/TermStory";

const MODULES = [
  { icon: Users, title: "Admissions", body: "Student records, guardians, photos and bulk import from CSV." },
  { icon: CalendarCheck, title: "Attendance", body: "Daily class registers with reports you can act on." },
  { icon: ClipboardList, title: "Results", body: "Scores, approval, class positions and printable report cards." },
  { icon: Wallet, title: "Fees", body: "Invoices, discounts, waivers, verified payments and receipts." },
  { icon: FileCheck2, title: "Promotion", body: "Move students up to their next class when the session ends." },
  { icon: Smartphone, title: "Parent portal", body: "Fees, attendance and results for each child, on any phone." },
];

const SAFEGUARDS = [
  { icon: Building2, title: "Your school stays yours", body: "Every school's records are kept separate from every other school's." },
  { icon: UserCheck, title: "People see only their job", body: "Each role opens only what it needs. A parent sees only their own children." },
  { icon: KeyRound, title: "Files need a login", body: "Photos and payment proofs can't be opened by anyone who just has a link." },
  { icon: FileCheck2, title: "Changes leave a trail", body: "Important actions are recorded with who did them and when." },
];

const INCLUDED = ["Students and guardians", "Attendance registers and reports", "Results and report cards", "Fees, payments and receipts", "Parent portal", "Staff roles and permissions"];

const FAQS = [
  { q: "Do parents have to install an app?", a: "No. The portal opens in the browser on any phone, tablet or computer." },
  { q: "We already have our students in Excel. Do we retype them?", a: "No. Save the sheet as a CSV and import it. EduGear checks each row and shows what needs correcting before anything is saved." },
  { q: "Can our logo appear on documents?", a: "Yes. Upload it once in Settings and it prints on your receipts and report cards." },
  { q: "Can a parent with children in one school see all of them?", a: "Yes. Each child linked to that parent appears in the same portal login." },
];

function RegisterLink({ light = false, children = "Register your school" }: { light?: boolean; children?: ReactNode }) {
  return (
    <Link
      href="/register"
      className={
        light
          ? "group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-primary-navy transition-colors hover:bg-cloud-sky"
          : "group inline-flex items-center justify-center gap-2 rounded-xl bg-primary-navy px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-navy/90"
      }
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function DemoLink() {
  const classes = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white";
  if (!DEMO_VIDEO_URL) {
    return (
      <span className={`${classes} cursor-default opacity-70`}>
        <Play className="h-4 w-4" />
        Demo video coming soon
      </span>
    );
  }
  return (
    <a href={DEMO_VIDEO_URL} target="_blank" rel="noreferrer" className={`${classes} transition-colors hover:bg-white/10`}>
      <Play className="h-4 w-4" />
      Watch the demo
    </a>
  );
}

function SectionHeading({ kicker, title, body, light = false }: { kicker: string; title: string; body?: string; light?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className={light ? "text-sm font-semibold text-cloud-sky" : "text-sm font-semibold text-bright-blue"}>{kicker}</p>
      <h2 className={`mt-3 text-3xl font-bold tracking-tight sm:text-5xl ${light ? "text-white" : "text-primary-navy"}`}>{title}</h2>
      {body && <p className={`mt-4 text-lg leading-relaxed ${light ? "text-white/75" : "text-slate-gray"}`}>{body}</p>}
    </div>
  );
}

const SOCIAL_PATHS: Record<(typeof SOCIALS)[number]["label"], string> = {
  Facebook: "M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z",
  Instagram:
    "M7.8 3h8.4A4.8 4.8 0 0 1 21 7.8v8.4a4.8 4.8 0 0 1-4.8 4.8H7.8A4.8 4.8 0 0 1 3 16.2V7.8A4.8 4.8 0 0 1 7.8 3Zm0 1.8a3 3 0 0 0-3 3v8.4a3 3 0 0 0 3 3h8.4a3 3 0 0 0 3-3V7.8a3 3 0 0 0-3-3H7.8ZM12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 1.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4Zm4.8-3.2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z",
  LinkedIn:
    "M6.9 8.8H3.6V20h3.3V8.8ZM5.2 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM20.4 13.6c0-3.4-1.8-5-4.2-5-1.9 0-2.8 1.1-3.3 1.8V8.8H9.7V20H13v-5.5c0-1.5.3-2.9 2.1-2.9s1.9 1.7 1.9 3V20h3.4v-6.4Z",
  X: "M17.5 3h3.1l-6.8 7.8L21.8 21h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3H8l4.4 5.8L17.5 3Zm-1.1 16.2h1.7L7 4.7H5.2l11.2 14.5Z",
};

function SocialLinks() {
  return (
    <div className="flex gap-2">
      {SOCIALS.map((social) => {
        const icon = (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
            <path d={SOCIAL_PATHS[social.label]} />
          </svg>
        );
        const classes = "flex h-10 w-10 items-center justify-center rounded-lg bg-white/10";
        return social.href ? (
          <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className={`${classes} text-white transition-colors hover:bg-white/20`}>
            {icon}
          </a>
        ) : (
          <span key={social.label} title={`${social.label} link coming soon`} className={`${classes} text-white/45`}>
            {icon}
            <span className="sr-only">{social.label} link coming soon</span>
          </span>
        );
      })}
    </div>
  );
}

function ContactCard({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="rounded-xl bg-cloud-sky p-3 text-bright-blue">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-slate-gray">{label}</p>
        <p className={`mt-0.5 break-words font-semibold ${value ? "text-primary-navy" : "text-slate-gray/70"}`}>{value || "Coming soon"}</p>
      </div>
    </>
  );
  const classes = "flex items-center gap-4 rounded-2xl border border-slate-gray/10 bg-white p-5";
  return value && href ? (
    <a href={href} className={`${classes} transition-colors hover:border-bright-blue/40`}>
      {body}
    </a>
  ) : (
    <div className={classes}>{body}</div>
  );
}

export function LandingPage() {
  return (
    <div className="landing overflow-x-clip bg-white text-primary-navy">
      <div className="relative overflow-hidden bg-primary-navy text-white">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.09)_1px,transparent_1px)] [background-size:26px_26px]" />
        <div aria-hidden className="absolute -right-40 -top-40 h-[42rem] w-[42rem] rounded-full bg-bright-blue/50 blur-[130px]" />
        <LandingNav />
        <section className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-36 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-32 lg:pt-44">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              The school office, without the paper chase.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              EduGear keeps admissions, attendance, results and fees in one place, and gives every parent a clear view of their child.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <RegisterLink light />
              <DemoLink />
            </div>
          </div>
          <HeroConsole />
        </section>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="reveal">
          <SectionHeading kicker="One system" title="Six jobs your school does every term." />
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-gray/10 bg-slate-gray/10 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.title} className="reveal bg-white p-7 transition-colors hover:bg-cloud-sky/40">
              <m.icon className="h-6 w-6 text-bright-blue" />
              <h3 className="mt-5 text-lg font-bold">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-gray">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-8 bg-gradient-to-b from-cloud-sky/50 to-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:pt-28">
          <SectionHeading kicker="How it works" title="Follow one term through EduGear." body="From the first day of resumption to the report card in a parent's hand." />
          <div className="mt-10 lg:mt-4">
            <TermStory />
          </div>
        </div>
      </section>

      <section id="roles" className="scroll-mt-8 bg-primary-navy">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading light kicker="Who it's for" title="One set of records. The right view for each person." />
          <div className="mt-12">
            <RoleSwitcher />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="reveal">
          <SectionHeading kicker="Trust" title="Children's records deserve care." body="Student information is sensitive. EduGear is built around that." />
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAFEGUARDS.map((s) => (
            <div key={s.title} className="reveal rounded-2xl bg-cloud-sky/50 p-6">
              <s.icon className="h-6 w-6 text-bright-blue" />
              <h3 className="mt-5 font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-gray">{s.body}</p>
            </div>
          ))}
        </div>
        <Link href="/privacy" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-bright-blue hover:underline">
          Read our privacy policy <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section id="pricing" className="scroll-mt-8 bg-cloud-sky/50">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading kicker="Pricing" title={PLANS.length > 0 ? "Clear prices, shown right here." : "Pricing for your school."} />
          {PLANS.length > 0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <div key={plan.name} className="flex flex-col rounded-2xl bg-white p-7 shadow-lg shadow-primary-navy/5">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-gray">{plan.description}</p>
                  <p className="mt-6 text-4xl font-bold tracking-tight">{plan.price}</p>
                  <p className="mt-1 text-sm text-slate-gray">{plan.period}</p>
                  <ul className="my-6 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-bright-blue" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <RegisterLink>Get started</RegisterLink>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-12 grid overflow-hidden rounded-2xl bg-white shadow-lg shadow-primary-navy/5 lg:grid-cols-2">
              <div className="bg-primary-navy p-8 text-white sm:p-10">
                <h3 className="text-3xl font-bold tracking-tight">Plans coming soon</h3>
                <p className="mt-3 max-w-md leading-relaxed text-white/75">We&apos;re finalising our plans. Prices will be published here.</p>
                <div className="mt-8">
                  <RegisterLink light />
                </div>
              </div>
              <div className="p-8 sm:p-10">
                <p className="font-bold">What EduGear covers</p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-slate-gray">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-bright-blue" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading kicker="Questions" title="Good to know." />
        <div className="mt-10 divide-y divide-slate-gray/10 border-y border-slate-gray/10">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span aria-hidden className="text-xl leading-none text-bright-blue transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-slate-gray">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contact" className="scroll-mt-8 bg-cloud-sky/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.4fr] lg:py-28">
          <SectionHeading kicker="Contact" title="Talk to a real person." body="Ask us anything about bringing your school onto EduGear." />
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <ContactCard icon={MessageCircle} label="WhatsApp" value={CONTACT.whatsapp ? "Chat with us" : ""} href={CONTACT.whatsapp} />
            <ContactCard icon={Phone} label="Phone" value={CONTACT.phone} href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} />
            <ContactCard icon={Mail} label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
            <ContactCard icon={MapPin} label="Office" value={CONTACT.address} />
          </div>
        </div>
      </section>

      <footer className="bg-primary-navy text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-8 border-b border-white/10 py-16 lg:flex-row lg:items-center lg:py-20">
            <h2 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">Give your school office its time back.</h2>
            <RegisterLink light />
          </div>
          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div>
              <EduGearLogo variant="outline" withWordmark />
              <div className="mt-6">
                <SocialLinks />
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 text-sm text-white/70">
              <p className="font-semibold text-white">Product</p>
              <a href="#how-it-works" className="hover:text-white">How it works</a>
              <a href="#roles" className="hover:text-white">Who it&apos;s for</a>
              <a href="#pricing" className="hover:text-white">Pricing</a>
              {DEMO_VIDEO_URL && <a href={DEMO_VIDEO_URL} target="_blank" rel="noreferrer" className="hover:text-white">Demo video</a>}
            </div>
            <div className="flex flex-col items-start gap-3 text-sm text-white/70">
              <p className="font-semibold text-white">Account</p>
              <Link href="/register" className="hover:text-white">Register your school</Link>
              <Link href="/login" className="hover:text-white">Log in</Link>
              <Link href="/privacy" className="hover:text-white">Privacy policy</Link>
              <a href="#contact" className="hover:text-white">Contact</a>
            </div>
          </div>
          <p className="border-t border-white/10 py-6 text-xs text-white/50">© {new Date().getFullYear()} A4 Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
