"use client";

import { useEffect } from "react";

/**
 * Browsers change a focused number input when the mouse wheel turns over it, so scrolling a form
 * past a fee amount or a score silently edits it (50000 became 49973). Blurring the field on wheel
 * lets the page scroll instead and leaves the value alone. Mounted once, it covers every form.
 */
export function NumberWheelGuard() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const el = e.target;
      if (el instanceof HTMLInputElement && el.type === "number" && el === document.activeElement) el.blur();
    };
    document.addEventListener("wheel", onWheel, { capture: true, passive: true });
    return () => document.removeEventListener("wheel", onWheel, { capture: true });
  }, []);
  return null;
}
