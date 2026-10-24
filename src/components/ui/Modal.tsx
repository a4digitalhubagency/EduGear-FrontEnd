"use client";

import { useId } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Shared modal shell, same overlay/card/header as GuardianFormModal. */
export function Modal({ title, onClose, children, className }: ModalProps) {
  const titleId = useId();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 animate-fade-in flex items-center justify-center bg-primary-navy/40 p-4"
    >
      <div className={cn("max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-dialog-in", className)}>
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold text-primary-navy">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-gray hover:text-primary-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
