"use client";

import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  completeGoogleRedirectLogin,
  loginWithGoogle,
  logoutBackendUser,
  logoutGoogleUser,
} from "@/services/googleAuth";

// AuthContext is tied to the Pages Router (next/router), so the App Router POC
// talks to the same Google sign-in service directly and writes the same Redux
// userData slice. Popup first; Firebase falls back to a redirect only when popups
// are blocked, and that redirect lands back on /aqua.
export function useAquaAuth(token: string | null) {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    completeGoogleRedirectLogin()
      .then((result: unknown) => {
        if (alive && result)
          dispatch({ type: "LOGGED_IN_USER", payload: result });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [dispatch]);

  const signIn = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const result = (await loginWithGoogle()) as {
        redirecting?: boolean;
      } | null;
      if (result && !result.redirecting)
        dispatch({ type: "LOGGED_IN_USER", payload: result });
    } catch (e) {
      setError((e as Error)?.message || "Couldn't sign you in. Try again.");
    } finally {
      setBusy(false);
    }
  }, [dispatch]);

  const signOut = useCallback(async () => {
    setBusy(true);
    // Firebase first, or the next load would sign the user straight back in.
    await logoutGoogleUser().catch(() => {});
    await logoutBackendUser(token).catch(() => {});
    dispatch({ type: "LOGOUT", payload: null });
    setBusy(false);
  }, [dispatch, token]);

  return { signIn, signOut, busy, error };
}
