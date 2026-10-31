"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "@/services/googleAuth";

// The account fields the assistant reads from Redux (profile + address book).
const SYNCED = [
  "firstName",
  "lastName",
  "phone",
  "dob",
  "photoURL",
  "addresses",
  "selectedAddress",
  // admin / tester / user: the profile shows admin and tester.
  "roleName",
] as const;
// Coming back to the tab refreshes at most this often.
const FOCUS_REFRESH_MS = 30_000;

export const accountPatch = (
  user: Record<string, unknown> | null | undefined,
) => {
  const patch: Record<string, unknown> = {};
  if (!user || typeof user !== "object") return patch;
  for (const key of SYNCED) if (key in user) patch[key] = user[key];
  return patch;
};

// Redux keeps the account as it was at sign-in. The server is the source of
// truth (an address added on the phone, at checkout or by the team), so pull
// the account on open, when the tab is focused again, and when `refresh()` is
// called before showing addresses (profile, checkout).
export function useAccountSync(token: string | null) {
  const dispatch = useDispatch();
  const last = useRef(0);

  const refresh = useCallback(async () => {
    if (!token) return;
    last.current = Date.now();
    try {
      const res = (await getCurrentUser(token)) as {
        user?: Record<string, unknown>;
      };
      const patch = accountPatch(res?.user);
      if (Object.keys(patch).length)
        dispatch({ type: "UPDATE_USER_DETAILS", payload: patch });
    } catch {
      // Offline or an expired session: keep what's stored; sign-in handles expiry.
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (!token) return;
    void refresh();
    const onFocus = () => {
      if (
        document.visibilityState !== "hidden" &&
        Date.now() - last.current > FOCUS_REFRESH_MS
      )
        void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [token, refresh]);

  return refresh;
}
