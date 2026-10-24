"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import { useAuthStore } from "@/lib/store/auth-store";

// Placeholder until the parent portal is built.
export default function PortalPage() {
  const router = useRouter();
  const firstName = useAuthStore((s) => s.user?.firstName);

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-primary-navy">Parent portal</h1>
      <p className="text-sm text-slate-gray">
        Welcome{firstName ? `, ${firstName}` : ""}. The parent portal is coming soon.
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm font-semibold text-bright-blue hover:underline"
      >
        Sign out
      </button>
    </main>
  );
}
