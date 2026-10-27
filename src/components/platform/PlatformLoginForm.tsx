"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { Input, PasswordInput } from "../ui/Input";
import { ApiError, errorMessage } from "../../lib/api-client";

/** A4 operator sign-in (POST /platform/auth/login). A separate door from school logins on purpose. */
export function PlatformLoginForm({ expired }: { expired: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(expired ? "Your session ended. Please sign in again." : null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/platform/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPending(false);
        if (res.status === 429) return setError("Too many attempts. Please wait a minute and try again.");
        if (data?.errorCode === "ACCOUNT_LOCKED") return setError(data.message ?? "This account is locked for now.");
        if (res.status === 401) return setError("Incorrect email or password, or this account has no platform access.");
        return setError(errorMessage(new ApiError(res.status, data), "Sign-in failed. Please try again."));
      }
      router.replace("/platform");
    } catch {
      setPending(false);
      setError("Can't reach the server. Please check your connection.");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-bright-blue">
        <ShieldCheck className="h-5 w-5" />
        <span className="text-xs font-bold uppercase tracking-wider">A4 Platform Console</span>
      </div>
      <h2 className="mt-2 text-2xl font-bold text-primary-navy">Operator sign in</h2>
      <p className="mt-1 text-sm text-slate-gray">For EduGear staff at A4 Technologies only. Schools sign in at the main login page.</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordInput label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <FormError message={error} />
        <Button type="submit" isLoading={pending}>
          Sign In
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
