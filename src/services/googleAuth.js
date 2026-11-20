import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  getFirebaseAuth,
  getGoogleProvider,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import { disableGoogleAutoSelect } from "@/services/googleOneTap";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const AUTH_REQUEST_TIMEOUT_MS = 6_000;
const FIREBASE_OPERATION_TIMEOUT_MS = 5_000;
const authUrl = (path) => {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local and restart the dev server.",
    );
  }
  return `${API_URL.endsWith("/v1") ? API_URL : `${API_URL}/v1`}${path}`;
};

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Google authentication failed");
  }

  return data;
};

const withTimeout = (promise, timeoutMs, message) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });

const exchangeGoogleUser = async (user) => {
  const firebaseIdToken = await withTimeout(
    user.getIdToken(),
    FIREBASE_OPERATION_TIMEOUT_MS,
    "Google verification took too long. Please try again.",
  );

  return exchangeFirebaseIdToken(firebaseIdToken);
};

export const exchangeFirebaseIdToken = async (firebaseIdToken) => {
  if (!firebaseIdToken) {
    throw new Error("Google verification is required.");
  }

  const firebaseAuth = getFirebaseAuth();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(authUrl("/auth/google"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firebaseIdToken}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Google sign-in took too long. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  try {
    return await parseResponse(response);
  } catch (error) {
    await signOut(firebaseAuth);
    throw error;
  }
};

export const shouldUseRedirectFallback = (error) =>
  [
    "auth/popup-blocked",
    "auth/operation-not-supported-in-this-environment",
    "auth/web-storage-unsupported",
  ].includes(error?.code);

// Set just before a redirect sign-in leaves the page (this tab only), so the
// page it comes back to knows to read the result. Reading it otherwise costs
// a hidden Google frame and seconds of "Checking sign-in…" on every load.
const REDIRECT_PENDING_KEY = "aquakart_google_redirect";
const REDIRECT_MAX_AGE_MS = 10 * 60 * 1000;

const startRedirectSignIn = (firebaseAuth) => {
  try {
    window.sessionStorage.setItem(REDIRECT_PENDING_KEY, String(Date.now()));
  } catch {
    // Storage blocked: the return check below then always looks.
  }
  return signInWithRedirect(firebaseAuth, getGoogleProvider());
};

// Was a redirect sign-in started in this tab (and not read yet)? Clears it.
// When storage can't be read, assume yes so a sign-in is never lost.
export const takeRedirectPending = (now = Date.now()) => {
  try {
    const store = window.sessionStorage;
    const startedAt = Number(store.getItem(REDIRECT_PENDING_KEY));
    store.removeItem(REDIRECT_PENDING_KEY);
    return Boolean(startedAt) && now - startedAt < REDIRECT_MAX_AGE_MS;
  } catch {
    return true;
  }
};

export const loginWithGoogle = async () => {
  const firebaseAuth = getFirebaseAuth();
  try {
    const credential = await signInWithPopup(firebaseAuth, getGoogleProvider());
    return exchangeGoogleUser(credential.user);
  } catch (error) {
    if (!shouldUseRedirectFallback(error)) throw error;
    await startRedirectSignIn(firebaseAuth);
    return { redirecting: true };
  }
};

// One Tap hands back a Google ID token instead of a popup result: sign it into
// Firebase so the session is the same one the popup flow creates.
export const loginWithGoogleIdToken = async (googleIdToken) => {
  const credential = await signInWithCredential(
    getFirebaseAuth(),
    GoogleAuthProvider.credential(googleIdToken),
  );
  return exchangeGoogleUser(credential.user);
};

export const loginWithGoogleForInvoice = async () => {
  const firebaseAuth = getFirebaseAuth();
  try {
    const credential = await signInWithPopup(firebaseAuth, getGoogleProvider());
    return {
      firebaseIdToken: await withTimeout(
        credential.user.getIdToken(true),
        FIREBASE_OPERATION_TIMEOUT_MS,
        "Google verification took too long. Please try again.",
      ),
      redirecting: false,
    };
  } catch (error) {
    if (!shouldUseRedirectFallback(error)) throw error;
    await startRedirectSignIn(firebaseAuth);
    return { redirecting: true };
  }
};

export const completeGoogleRedirectLogin = async () => {
  if (!isFirebaseConfigured() || !takeRedirectPending()) return null;
  const credential = await getRedirectResult(getFirebaseAuth());
  return credential ? exchangeGoogleUser(credential.user) : null;
};

// A stored Aquakart session is reused on page load (no new exchange with the
// backend) while it has more than this left; nearer expiry it is renewed.
export const SESSION_RENEW_BEFORE_MS = 7 * 24 * 60 * 60 * 1000;

// Expiry (ms since epoch) of an Aquakart session token, read from the JWT
// payload; null when it can't be read. Only used to decide when to renew:
// the backend still verifies every token.
export const sessionExpiresAt = (token) => {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    const json = JSON.parse(
      atob(
        part
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(Math.ceil(part.length / 4) * 4, "="),
      ),
    );
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
};

// The stored session can be used as is for this Firebase user: same Google
// account and not close to expiry.
export const canReuseSession = (session, firebaseUid, now = Date.now()) => {
  if (!session?.token || !firebaseUid) return false;
  if (session.user?.firebaseUid !== firebaseUid) return false;
  const expiresAt = sessionExpiresAt(session.token);
  return Boolean(expiresAt && expiresAt - now > SESSION_RENEW_BEFORE_MS);
};

const currentGoogleUser = async () => {
  if (!isFirebaseConfigured()) return null;
  const firebaseAuth = getFirebaseAuth();
  await withTimeout(
    firebaseAuth.authStateReady?.(),
    FIREBASE_OPERATION_TIMEOUT_MS,
    "Google session check took too long.",
  );
  return firebaseAuth.currentUser || null;
};

// On page load: with Firebase still signed in, reuse the stored session when
// it belongs to the same Google account ({ reused: true }, no network call),
// otherwise exchange the Google sign-in for a new Aquakart session.
export const restoreExistingGoogleLogin = async (session = null) => {
  const user = await currentGoogleUser();
  if (!user) return null;
  if (canReuseSession(session, user.uid)) return { reused: true };
  return exchangeGoogleUser(user);
};

// A fresh Aquakart session for the Google account Firebase still has (after
// the backend refused the stored one). Null when Firebase is signed out.
export const renewGoogleSession = async () => {
  const user = await currentGoogleUser();
  return user ? exchangeGoogleUser(user) : null;
};

// Clears the Firebase session (IndexedDB + localStorage). Without this the SDK
// silently restores the user on the next page load, so "sign out" never sticks.
export const logoutGoogleUser = async () => {
  if (!isFirebaseConfigured()) return;
  await signOut(getFirebaseAuth());
};

// Keeps Redux in sync with Firebase — covers sign-out from another tab and
// sessions Firebase drops on its own (revoked/expired credentials).
export const observeGoogleAuthState = (listener) => {
  if (!isFirebaseConfigured()) return () => {};
  try {
    return onAuthStateChanged(getFirebaseAuth(), listener);
  } catch {
    return () => {};
  }
};

export const getCurrentFirebaseIdToken = async () => {
  const firebaseAuth = getFirebaseAuth();
  await withTimeout(
    firebaseAuth.authStateReady?.(),
    FIREBASE_OPERATION_TIMEOUT_MS,
    "Google verification took too long. Please try again.",
  );
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) {
    const error = new Error("Please continue with Google first");
    error.code = "auth/no-current-user";
    throw error;
  }
  return withTimeout(
    currentUser.getIdToken(true),
    FIREBASE_OPERATION_TIMEOUT_MS,
    "Google verification took too long. Please try again.",
  );
};

// Is the stored session still accepted? "ok" (with the account as the server
// has it), "invalid" (expired, signed out or unknown user) or "unknown"
// (offline, server error): only "invalid" should end or renew the session.
export const checkBackendSession = async (token) => {
  if (!token) return { state: "invalid" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(authUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (response.status === 401) return { state: "invalid" };
    if (!response.ok) return { state: "unknown" };
    const data = await response.json().catch(() => ({}));
    return { state: "ok", user: data.user || null };
  } catch {
    return { state: "unknown" };
  } finally {
    clearTimeout(timeout);
  }
};

// The signed-in account as the server has it now (GET /auth/me): profile and
// address book, so every device and page works from the same saved addresses.
export const getCurrentUser = async (token) => {
  const response = await fetch(authUrl("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response);
};

// Cancels the session token on the backend so it stops working at once.
// keepalive lets it finish when sign-out navigates away.
export const logoutBackendUser = async (token) => {
  if (!token) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  try {
    await fetch(authUrl("/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

// Per-user data kept in this tab (open chat, paid-link receipts) that must not
// carry over to the next person who signs in on this browser.
const SIGNED_IN_TAB_KEYS = [/^aqua\.chat\.tab$/, /^aq-pay-paid:/];
const clearSignedInTabData = () => {
  try {
    const store = window.sessionStorage;
    for (let i = store.length - 1; i >= 0; i -= 1) {
      const key = store.key(i);
      if (key && SIGNED_IN_TAB_KEYS.some((re) => re.test(key)))
        store.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing stored either.
  }
};

// The one sign-out every page uses. Firebase goes first: while its session
// lives, the next page load would sign the shopper straight back in. Each step
// is independent, so one failing never leaves the others undone.
export const signOutEverywhere = async (token) => {
  try {
    disableGoogleAutoSelect();
  } catch {
    // One Tap not loaded.
  }
  const [firebase, backend] = await Promise.allSettled([
    logoutGoogleUser(),
    logoutBackendUser(token),
  ]);
  if (typeof window !== "undefined") clearSignedInTabData();
  if (firebase.status === "rejected")
    console.error("Firebase sign-out failed", firebase.reason);
  if (backend.status === "rejected")
    console.error("Backend sign-out failed", backend.reason);
};
