"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight } from "lucide-react";
import { EduGearLogo } from "../EduGearLogo";
import { Input, PasswordInput } from "../ui/Input";
import { Checkbox } from "../ui/Checkbox";
import { Button } from "../ui/Button";
import { loginSchema, type LoginValues } from "../../lib/validation/auth";
import { useAuthStore } from "../../lib/store/auth-store";

const UNREACHABLE_MESSAGE = "Can't reach the server. Please try again shortly.";

// Branch on errorCode first: ACCOUNT_LOCKED arrives as a 401 too, so status alone would hide it.
function loginErrorMessage(status: number, body: { errorCode?: string; message?: string } | null) {
  if (body?.errorCode === "ACCOUNT_LOCKED") {
    return "Account temporarily locked after too many failed attempts. Try again in 15 minutes.";
  }
  if (status === 429 || body?.errorCode === "RATE_LIMITED") return "Too many attempts. Please wait and try again.";
  if (status === 502 || body?.errorCode === "BACKEND_UNREACHABLE") return UNREACHABLE_MESSAGE;
  if (status === 401) return "Invalid email or password.";
  // 403s (pending invitation, inactive account, no active school) carry a user-facing message.
  if (status === 403 && body?.message) return body.message;
  return "Something went wrong. Please try again.";
}

/**
 * Login form — "Login - Default State" screen from the Stitch design system.
 * Fields: School Email Address, Password, Remember this device for 30 days.
 */
export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setServerError(loginErrorMessage(res.status, data));
        return;
      }

      setSession(data);
      // Parents only hold portal.access and are refused on staff routes, so they go to the portal.
      router.push(data.permissions.includes("portal.access") ? "/portal" : "/dashboard");
    } catch {
      // fetch itself failed: the Next.js server (not just the backend) is unreachable.
      setServerError(UNREACHABLE_MESSAGE);
    }
  }

  return (
    <div>
      <EduGearLogo withWordmark className="mb-8 lg:hidden" />

      <h2 className="text-2xl font-bold text-primary-navy">Welcome back</h2>
      <p className="mt-1 text-sm text-slate-gray">
        Secure access to your school&apos;s operating system.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Input
          label="School Email Address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="admin@school.edu.ng"
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          labelAction={
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-bright-blue hover:underline"
            >
              Forgot password?
            </Link>
          }
          {...register("password")}
        />

        <Checkbox
          label="Remember this device for 30 days"
          {...register("remember")}
        />

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {serverError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Sign In to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-gray">
        New school?{" "}
        <Link href="/register" className="font-semibold text-bright-blue hover:underline">
          Register your school
        </Link>
        <span className="mt-1 block text-xs">Staff and parents: ask your school to invite you.</span>
      </p>

      <div className="mt-8 flex items-center justify-center gap-4 border-t border-slate-gray/10 pt-6 text-xs text-slate-gray">
        <a href="/support" className="hover:text-primary-navy">
          Support
        </a>
        <span aria-hidden>&middot;</span>
        <a href="/privacy" className="hover:text-primary-navy">
          Privacy
        </a>
      </div>
    </div>
  );
}