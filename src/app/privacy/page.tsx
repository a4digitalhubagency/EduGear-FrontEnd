import type { Metadata } from "next";
import Link from "next/link";
import { EduGearLogo } from "@/components/EduGearLogo";

export const metadata: Metadata = { title: "EduGear - Privacy Policy" };

const UPDATED = "28 October 2026";
const CONTACT = "support@edugear.ng";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-primary-navy">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-slate-gray">{children}</div>
    </section>
  );
}

/**
 * Public privacy policy, linked from login and sign-up. Written from what EduGear actually
 * stores and the services it actually uses (backend .env: Railway, Cloudflare R2, Resend,
 * Paystack, Sentry); keep it in step if any of those change.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <article className="mx-auto max-w-3xl">
        <Link href="/login" aria-label="EduGear home">
          <EduGearLogo />
        </Link>
        <h1 className="mt-10 text-3xl font-bold text-primary-navy">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-gray">Last updated {UPDATED}</p>

        <Section title="Who we are">
          <p>
            EduGear is a school management platform provided by A4 Technologies (&ldquo;we&rdquo;, &ldquo;us&rdquo;). Schools use EduGear to manage
            admissions, attendance, results, fees and communication with parents.
          </p>
          <p>
            Each school decides what information it records about its students, parents and staff, and why. For that information the school is the
            data controller and A4 Technologies processes it on the school&apos;s behalf. For the accounts of people who register a school with us, and
            for running the platform itself, A4 Technologies is the data controller. We handle personal data in line with the Nigeria Data Protection
            Act 2023.
          </p>
        </Section>

        <Section title="What we hold">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><span className="font-semibold text-primary-navy">Students:</span> names, gender, date of birth, admission details, class, photo, attendance, scores, report cards, fee invoices and payments, and any notes the school adds.</li>
            <li><span className="font-semibold text-primary-navy">Parents and guardians:</span> names, phone numbers, email addresses, home address, occupation and relationship to the student.</li>
            <li><span className="font-semibold text-primary-navy">Staff and account holders:</span> names, email addresses, phone numbers, role, and a securely hashed password (we never store passwords in readable form).</li>
            <li><span className="font-semibold text-primary-navy">Payments:</span> amounts, dates, methods, references and any proof of payment a parent uploads. Card details are entered on our payment provider&apos;s page and never reach EduGear.</li>
            <li><span className="font-semibold text-primary-navy">Activity records:</span> sign-in times and a record of important changes (for example, who verified a payment or published results), kept so schools can see who did what.</li>
          </ul>
        </Section>

        <Section title="How it is used">
          <p>
            Only to provide EduGear to the school: keeping its records, producing report cards and receipts, letting parents see their own
            children&apos;s information, sending account emails (invitations, email verification and password resets) and notifications, keeping the
            service secure, and fixing faults. We do not sell personal data and do not use it for advertising.
          </p>
        </Section>

        <Section title="Who can see it">
          <p>
            Each school&apos;s data is kept separate from every other school&apos;s. Within a school, staff see only what their role allows, and parents see
            only their own children. A4 Technologies staff who run the platform see school-level details (such as a school&apos;s name, contact details and
            how many students it has), not individual students&apos; records.
          </p>
          <p>We use these service providers to run EduGear, each only for the purpose shown:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><span className="font-semibold text-primary-navy">Railway:</span> hosting for our servers and database.</li>
            <li><span className="font-semibold text-primary-navy">Cloudflare R2:</span> storage for uploaded files such as student photos, school logos and proof of payment.</li>
            <li><span className="font-semibold text-primary-navy">Resend:</span> delivery of account emails and notifications.</li>
            <li><span className="font-semibold text-primary-navy">Paystack:</span> online fee payments.</li>
            <li><span className="font-semibold text-primary-navy">Sentry:</span> error monitoring, so we can find and fix faults.</li>
          </ul>
          <p>Some of these providers may process data outside Nigeria. We may also disclose information where the law requires it.</p>
        </Section>

        <Section title="Cookies">
          <p>
            EduGear uses only the cookies needed to keep you signed in securely, including one that remembers your device if you tick &ldquo;Remember
            this device&rdquo;. They cannot be read by scripts on the page. We do not use advertising or analytics cookies.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            A school&apos;s records are kept while it uses EduGear, so it can refer back to past terms, results and payments. If a school leaves, its
            account is closed; ask us if you would like its data deleted. Schools can ask us at any time to export or delete their data.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can ask to see the personal data held about you, to have it corrected or deleted, to restrict or object to how it is used, or to
            receive a copy of it. Because schools control their own records, please contact your school first for anything about a student, parent or
            staff record; we will help the school respond. For anything else, contact us at the address below.
          </p>
          <p>If you are not satisfied with our response, you can complain to the Nigeria Data Protection Commission.</p>
        </Section>

        <Section title="Security">
          <p>
            Connections to EduGear are encrypted, passwords are hashed, accounts are locked after repeated failed sign-ins, and access is limited by
            role. No system is perfectly secure, but we work to protect the information entrusted to us and will act promptly if anything goes wrong.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy or your data:{" "}
            <a href={`mailto:${CONTACT}`} className="font-semibold text-bright-blue hover:underline">
              {CONTACT}
            </a>
            . We may update this policy from time to time; the date at the top shows the latest version.
          </p>
        </Section>

        <p className="mt-12 border-t border-slate-gray/10 pt-6 text-xs text-slate-gray">
          <Link href="/login" className="font-semibold text-bright-blue hover:underline">
            Back to sign in
          </Link>
        </p>
      </article>
    </div>
  );
}
