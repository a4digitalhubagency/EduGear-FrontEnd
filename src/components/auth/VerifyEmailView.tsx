"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldAlert } from "lucide-react";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { Input } from "../ui/Input";
import { api, errorMessage, jsonBody } from "../../lib/api-client";

type Stage = "verifying" | "verified" | "failed";

/**
 * Email verification (POST /auth/verify-email), run as soon as the emailed link opens.
 * If the link is bad or used, the user can ask for a new one (POST
 * /auth/resend-verification), which answers the same whether or not the email exists.
 */
export function VerifyEmailView({ token }: { token: string | null }) {
  const [stage, setStage] = useState<Stage>(token ? "verifying" : "failed");
  const [reason, setReason] = useState<string | null>(token ? null : "This link is missing its verification code.");
  // The token works once. React's development mode runs effects twice, so make sure it's sent once.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    api("/auth/verify-email", { ...jsonBody("POST", { token }), auth: false })
      .then(() => setStage("verified"))
      .catch((err) => {
        setReason(errorMessage(err));
        setStage("failed");
      });
  }, [token]);

  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setResending(true);
    setResendError(null);
    try {
      await api("/auth/resend-verification", { ...jsonBody("POST", { email: email.trim() }), auth: false });
      setResent(true);
    } catch (err) {
      setResendError(errorMessage(err));
    } finally {
      setResending(false);
    }
  }

  if (stage === "verifying") {
    return (
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-bright-blue" />
        <p className="mt-4 text-sm text-slate-gray">Verifying your email address...</p>
      </div>
    );
  }

  if (stage === "verified") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cloud-sky">
          <CheckCircle2 className="h-7 w-7 text-bright-blue" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-primary-navy">Email verified</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-gray">Thanks for confirming your email address.</p>
        <Link href="/login" className="mt-8 block">
          <Button type="button">
            Continue to Sign In
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert className="h-7 w-7 text-red-500" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-primary-navy">Link expired or invalid</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-gray">{reason ?? "This verification link can't be used."} Request a new one below.</p>

      {resent ? (
        <p className="mt-6 rounded-lg bg-cloud-sky/40 px-3 py-3 text-sm text-primary-navy">
          If that email belongs to an account that still needs verifying, a new link is on its way.
        </p>
      ) : (
        <form onSubmit={resend} className="mt-6 space-y-3 text-left" noValidate>
          <Input label="Email Address" icon={Mail} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormError message={resendError} />
          <Button type="submit" isLoading={resending} disabled={!email.trim()}>
            Send a New Link
          </Button>
        </form>
      )}

      <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-bright-blue hover:underline">
        Back to Sign In
      </Link>
    </div>
  );
}
