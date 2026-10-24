"use client";

import { usePathname } from "next/navigation";

/**
 * Fades each page in as you navigate. Keyed on the path, so the animation replays per
 * page but not when only the query string changes (e.g. a Finance tab link).
 *
 * Opacity only, no slide: any transform here, even mid-animation, would make this div
 * the containing block for the page's position:fixed modals, so a modal that opens on
 * arrival (the Record Payment deep link) would briefly sit inside the page, not over it.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  );
}
