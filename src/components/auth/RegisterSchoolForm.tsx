"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { Input, PasswordInput } from "../ui/Input";
import { SelectField } from "../ui/Select";
import { ApiError, passwordErrorMessage } from "../../lib/api-client";
import { NIGERIAN_STATES } from "../../lib/nigerian-states";
import { useAuthStore } from "../../lib/store/auth-store";
import { cn } from "../../lib/utils";
import { PASSWORD_REQUIREMENTS, registerSchoolSchema, type RegisterSchoolValues } from "../../lib/validation/auth";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wider text-slate-gray">{children}</p>;
}

/**
 * New school sign-up (POST /auth/register-school via /api/auth/register): creates the
 * school, its system roles and the proprietor's login, and signs them straight in.
 */
export function RegisterSchoolForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchoolValues>({
    resolver: zodResolver(registerSchoolSchema),
    defaultValues: {
      schoolName: "", schoolEmail: "", schoolPhone: "", city: "", state: "",
      firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "",
    },
  });
  const password = useWatch({ control, name: "password" });

  async function onSubmit({ confirmPassword: _confirm, ...values }: RegisterSchoolValues) {
    void _confirm;
    setError(null);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.errorCode === "BACKEND_UNREACHABLE") return setError("Can't reach the server. Please try again in a moment.");
        if (res.status === 429) return setError("Too many attempts. Please wait a minute and try again.");
        return setError(passwordErrorMessage(new ApiError(res.status, data)));
      }
      setSession(data);
      router.push("/dashboard");
    } catch {
      setError("Can't reach the server. Please check your connection and try again.");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary-navy">Register your school</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-gray">
        Set up your school on EduGear. You&apos;ll be the proprietor and can invite your staff afterwards.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <SectionTitle>School</SectionTitle>
        <Input label="School Name *" placeholder="Bright Star College" error={errors.schoolName?.message} {...register("schoolName")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="School Email *" type="email" placeholder="info@school.edu.ng" error={errors.schoolEmail?.message} {...register("schoolEmail")} />
          <Input label="School Phone" type="tel" placeholder="08031234567" error={errors.schoolPhone?.message} {...register("schoolPhone")} />
          <Input label="City" placeholder="Ibadan" error={errors.city?.message} {...register("city")} />
          <SelectField label="State" error={errors.state?.message} {...register("state")}>
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="border-t border-slate-gray/10 pt-5">
          <SectionTitle>Proprietor (your login)</SectionTitle>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First Name *" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last Name *" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
          <Input label="Your Email *" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input label="Your Phone" type="tel" autoComplete="tel" placeholder="08031234567" error={errors.phone?.message} {...register("phone")} />
          <PasswordInput label="Password *" autoComplete="new-password" placeholder="••••••••••" error={errors.password?.message} {...register("password")} />
          <PasswordInput label="Confirm Password *" autoComplete="new-password" placeholder="••••••••••" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        </div>
        <ul className="space-y-1.5">
          {PASSWORD_REQUIREMENTS.map((req) => {
            const met = req.test(password ?? "");
            return (
              <li key={req.label} className={cn("flex items-center gap-2 text-xs font-medium", met ? "text-bright-blue" : "text-slate-gray/60")}>
                <Check className={cn("h-3.5 w-3.5", met ? "opacity-100" : "opacity-40")} />
                {req.label}
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-slate-gray">
          By creating an account you agree to how we handle data, as set out in our{" "}
          <Link href="/privacy" target="_blank" className="font-semibold text-bright-blue hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <FormError message={error} />
        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? "Creating your school..." : "Create School Account"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-gray">
        Already on EduGear?{" "}
        <Link href="/login" className="font-semibold text-bright-blue hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
