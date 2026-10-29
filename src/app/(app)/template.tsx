import type { ReactNode } from "react";

/**
 * A template remounts on every navigation between sections (a layout doesn't), so each
 * page rises in as it opens instead of snapping into place. The app shell around it stays put.
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-fade-in-up">{children}</div>;
}
