"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";

type Area = "staff" | "portal";

// Parents hold portal.access; the backend refuses their tokens outside /portal/* and refuses
// staff tokens on /portal/*, so each area sends the wrong kind of user to its own home.
const HOME: Record<Area, string> = { staff: "/dashboard", portal: "/portal" };

export function AuthGate({ area, children }: { area: Area; children: React.ReactNode }) {
  const router = useRouter();
  const ready = useAuthStore((s) => s.ready);
  const signedIn = useAuthStore((s) => !!s.accessToken);
  const userArea: Area = useAuthStore((s) => (s.permissions.includes("portal.access") ? "portal" : "staff"));

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) router.replace("/login");
    else if (userArea !== area) router.replace(HOME[userArea]);
  }, [ready, signedIn, userArea, area, router]);

  if (!ready || !signedIn || userArea !== area) return null;
  return <>{children}</>;
}
