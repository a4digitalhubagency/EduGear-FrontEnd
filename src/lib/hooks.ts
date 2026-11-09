"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** value, but only after it has stopped changing for delayMs (e.g. search-as-you-type). */
export function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

const subscribeToNothing = () => () => {};

/**
 * False in the server-rendered HTML, true once React has taken over the page. Until then a form's
 * onSubmit doesn't exist yet, so a click would make the browser submit the fields itself.
 */
export function useHydrated() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}
