"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiError, errorMessage } from "@/lib/api-client";

type Stage = "confirming" | "confirmed" | "failed";

/**
 * Opened from the link sent to an operator's new address. Posting the token is what moves the
 * account; the old address is then told. Works without a platform session.
 */
export function PlatformConfirmEmailView({ token }: { token: string | null }) {
  const [stage, setStage] = useState<Stage>(token ? "confirming" : "failed");
  const [reason, setReason] = useState<string | null>(token ? null : "This link is missing its confirmation code.");
  // The token works once. React's development mode runs effects twice, so make sure it's sent once.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    (async () => {
      try {
        const res = await fetch("/api/platform/confirm-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (res.ok) return setStage("confirmed");
        setReason(errorMessage(new ApiError(res.status, await res.json().catch(() => null))));
      } catch {
        setReason("Can't reach the server. Please check your connection and reload this page.");
      }
      setStage("failed");
    })();
  }, [token]);

  if (stage === "confirming") {
    return (
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-bright-blue" />
        <p className="mt-4 text-sm text-slate-gray">Confirming your new email address...</p>
      </div>
    );
  }

  const ok = stage === "confirmed";
  return (
    <div className="text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${ok ? "bg-cloud-sky" : "bg-red-50"}`}>
        {ok ? <CheckCircle2 className="h-7 w-7 text-bright-blue" /> : <ShieldAlert className="h-7 w-7 text-red-500" />}
      </div>
      <h2 className="mt-6 text-2xl font-bold text-primary-navy">{ok ? "Email changed" : "Link expired or invalid"}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-gray">
        {ok
          ? "Your platform account now signs in with this address. The old address has been told about the change."
          : `${(reason ?? "This confirmation link can't be used.").replace(/([^.!?])$/, "$1.")} Your email hasn't changed. Request a new link from the Account screen in the console.`}
      </p>
      <Link href="/platform" className="mt-8 block">
        <Button type="button">
          Go to the Console
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
