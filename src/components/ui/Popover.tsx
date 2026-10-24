"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
  /** The button that opens it; receives the open state for aria-expanded. */
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  /** Panel content; call close() after a choice that should dismiss it. */
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

/** Dropdown panel anchored under its trigger. Closes on outside click and Escape. */
export function Popover({ trigger, children, align = "right", className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={cn(
            "absolute top-full z-40 mt-2 animate-dropdown-in rounded-xl border border-slate-gray/10 bg-white shadow-xl",
            // Grow out of the corner it's anchored to.
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
