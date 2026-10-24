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
// Firebase errors in words a shopper can act on. Closing the popup isn't an error.
export const signInMessage = (
  e: { code?: string; message?: string } | null,
) => {
  switch (e?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return "";
    case "auth/unauthorized-domain":
      return `Google sign-in isn't enabled for ${typeof window !== "undefined" ? window.location.hostname : "this site"} yet. Add it under Firebase → Authentication → Settings → Authorized domains.`;
    case "auth/network-request-failed":
      return "Couldn't reach Google. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Wait a minute and try again.";
    default:
      return e?.message || "Couldn't sign you in. Try again.";
  }
};

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
      setError(signInMessage(e as { code?: string; message?: string }));
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
