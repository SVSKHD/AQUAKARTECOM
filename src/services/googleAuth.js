import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  getFirebaseAuth,
  getGoogleProvider,
  isFirebaseConfigured,
} from "@/lib/firebase/client";

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

export const friendlyGoogleAuthError = (error) => {
  const message = error?.message || "";
  const code = error?.code || "";

  if (
    code === "auth/web-storage-unsupported" ||
    message.toLowerCase().includes("database is closing/hidden")
  ) {
    return "Safari blocked secure Google session storage. Please keep this tab open and try Continue with Google again.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was closed before it finished. Please try again.";
  }

  if (code === "auth/popup-blocked") {
    return "Please allow pop-ups for Aquakart and try Google sign-in again.";
  }

  return message || "Unable to continue with Google";
};

export const isFirebaseStorageClosingError = (error) =>
  (error?.message || "").toLowerCase().includes("database is closing/hidden");

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
  ].includes(error?.code) || isFirebaseStorageClosingError(error);

export const loginWithGoogle = async () => {
  const firebaseAuth = getFirebaseAuth();
  try {
    const credential = await signInWithPopup(firebaseAuth, getGoogleProvider());
    return exchangeGoogleUser(credential.user);
  } catch (error) {
    if (!shouldUseRedirectFallback(error)) throw error;
    await signInWithRedirect(firebaseAuth, getGoogleProvider());
    return { redirecting: true };
  }
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
    await signInWithRedirect(firebaseAuth, getGoogleProvider());
    return { redirecting: true };
  }
};

export const completeGoogleRedirectLogin = async () => {
  if (!isFirebaseConfigured()) return null;
  const credential = await getRedirectResult(getFirebaseAuth());
  return credential ? exchangeGoogleUser(credential.user) : null;
};

export const restoreExistingGoogleLogin = async () => {
  if (!isFirebaseConfigured()) return null;
  const firebaseAuth = getFirebaseAuth();
  await withTimeout(
    firebaseAuth.authStateReady?.(),
    FIREBASE_OPERATION_TIMEOUT_MS,
    "Google session check took too long.",
  );
  return firebaseAuth.currentUser
    ? exchangeGoogleUser(firebaseAuth.currentUser)
    : null;
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

export const getCurrentUser = async (token) => {
  const response = await fetch(authUrl("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response);
};

export const logoutBackendUser = async (token) => {
  if (!token) return;
  await fetch(authUrl("/auth/logout"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};
