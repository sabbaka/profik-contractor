import { useEffect, useState } from "react";

/**
 * Holds back a fast-changing value (a slider being dragged, a price typed
 * character by character) so a dependent effect — a network request in
 * particular — only fires once the value has settled for `delayMs`.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
