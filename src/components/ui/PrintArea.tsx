"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const noop = () => () => {};

/**
 * Content that window.print() prints on its own (receipts, report cards). On screen it renders
 * in place. A copy also goes straight under <body> as .print-root, hidden on screen; when
 * printing, globals.css hides everything else and shows only that copy. Living outside the app
 * shell, it can't be clipped by the scrolling layout or a modal, and long content (a whole
 * class's report cards) flows across pages.
 */
export function PrintArea({ className, children }: { className?: string; children: ReactNode }) {
  // document only exists in the browser; render the print copy after hydration.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return (
    <>
      <div className={className}>{children}</div>
      {mounted && createPortal(<div className={cn("print-root", className)}>{children}</div>, document.body)}
    </>
  );
}
