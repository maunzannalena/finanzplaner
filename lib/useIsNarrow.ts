"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 640px)";

function subscribe(cb: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

/** True on phone-sized screens (client only; false during server render). */
export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
