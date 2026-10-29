import type { ReactNode } from "react";

/** Remounts on navigation, so each portal page rises in as it opens (see app/(app)/template.tsx). */
export default function PortalTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-fade-in-up">{children}</div>;
}
