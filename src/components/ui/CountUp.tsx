"use client";

import { useLayoutEffect, useRef } from "react";

const DURATION_MS = 700;
const NUMBER = /\d[\d,]*(\.\d+)?/; // the first number in "₦1,400,000", "₦1.4M", "46%", "21"

/**
 * A figure that counts up to its value when it appears, and from the old value to the new one
 * when it changes (₦640,000 → ₦680,000 after a payment is verified). Works on the formatted
 * text, so the ₦, the commas, decimals and suffixes like "M" or "%" come through unchanged;
 * text with no number ("—") just shows as-is.
 *
 * The moving text is written straight into an aria-hidden span (React never owns it, so it
 * can't fight React's updates); screen readers get the final value from a hidden copy.
 */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const match = value.match(NUMBER);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!match || match.index === undefined || reduced) {
      el.textContent = value;
      previous.current = match ? Number(match[0].replace(/,/g, "")) : null;
      return;
    }

    const target = Number(match[0].replace(/,/g, ""));
    const from = previous.current ?? 0;
    previous.current = target;
    const decimals = match[1] ? match[1].length - 1 : 0;
    const before = value.slice(0, match.index);
    const after = value.slice(match.index + match[0].length);
    const format = (n: number) =>
      before +
      n.toLocaleString("en-NG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: match[0].includes(",") }) +
      after;

    if (from === target) {
      el.textContent = value;
      return;
    }
    el.textContent = format(from);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - t) ** 3; // fast, then settles
      // The last frame shows the exact text given, not a re-formatted copy of it.
      el.textContent = t < 1 ? format(from + (target - from) * eased) : value;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Backstop: browsers pause animation frames in background tabs (and headless ones may stop
    // them), which would leave a wrong figure showing. A timer still lands the exact value.
    const settle = window.setTimeout(() => {
      cancelAnimationFrame(frame);
      el.textContent = value;
    }, DURATION_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      el.textContent = value; // interrupted (value changed again or unmount): never leave a half-way number
    };
  }, [value]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden className="tabular-nums" />
    </>
  );
}
