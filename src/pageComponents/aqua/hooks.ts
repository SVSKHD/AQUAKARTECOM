"use client";

import { useCallback, useSyncExternalStore } from "react";

function useMedia(query: string, serverValue = false) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useReducedMotion = () =>
  useMedia("(prefers-reduced-motion: reduce)");
export const useIsMobile = (breakpoint = 768) =>
  useMedia(`(max-width: ${breakpoint - 1}px)`);
// Finger rather than mouse (phones, iPads): needs 44px targets whatever the width.
export const useIsTouch = () => useMedia("(pointer: coarse)");

// localStorage can throw (private mode, blocked storage); never let it break the page.
export const storage = {
  get(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
};

let n = 0;
export const uid = (p = "m") =>
  `${p}${Date.now().toString(36)}${(n++).toString(36)}`;
