"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  completeGoogleRedirectLogin,
  loginWithGoogle,
  loginWithGoogleIdToken,
  logoutBackendUser,
  logoutGoogleUser,
} from "@/services/googleAuth";
import {
  cancelGoogleOneTap,
  disableGoogleAutoSelect,
  promptGoogleOneTap,
} from "@/services/googleOneTap";

// AuthContext is tied to the Pages Router (next/router), so the App Router POC
// talks to the same Google sign-in service directly and writes the same Redux
// userData slice. Google One Tap first (signs in on the page, no popup); when
// Google can't show it, the Firebase popup, and a redirect only if popups are
// blocked (that redirect lands back on /aqua).
const ONE_TAP_DELAY_MS = 1500;

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

  // The auto card and the button can resolve the same One Tap token: one login.
  const inFlight = useRef(false);
  const finish = useCallback(
    async (login: () => Promise<unknown>) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy(true);
      setError("");
      try {
        const result = (await login()) as { redirecting?: boolean } | null;
        if (result && !result.redirecting)
          dispatch({ type: "LOGGED_IN_USER", payload: result });
      } catch (e) {
        setError(signInMessage(e as { code?: string; message?: string }));
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [dispatch],
  );

  // Signed out: offer One Tap shortly after the page settles. Ignoring or
  // closing it is fine; the Sign in button stays.
  useEffect(() => {
    if (token) return;
    let alive = true;
    const timer = setTimeout(() => {
      promptGoogleOneTap()
        .then((idToken: string | null) => {
          if (alive && idToken)
            void finish(() => loginWithGoogleIdToken(idToken));
        })
        .catch(() => {});
    }, ONE_TAP_DELAY_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
      cancelGoogleOneTap();
    };
  }, [token, finish]);

  const signIn = useCallback(async () => {
    setError("");
    const idToken = (await promptGoogleOneTap().catch(() => null)) as
      string | null;
    await finish(() =>
      idToken ? loginWithGoogleIdToken(idToken) : loginWithGoogle(),
    );
  }, [finish]);

  const signOut = useCallback(async () => {
    setBusy(true);
    disableGoogleAutoSelect();
    // Firebase first, or the next load would sign the user straight back in.
    await logoutGoogleUser().catch(() => {});
    await logoutBackendUser(token).catch(() => {});
    dispatch({ type: "LOGOUT", payload: null });
    setBusy(false);
  }, [dispatch, token]);

  return { signIn, signOut, busy, error };
}
