import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const AUTH_REQUEST_TIMEOUT_MS = 6_000;
const FIREBASE_OPERATION_TIMEOUT_MS = 5_000;
const authUrl = (path) =>
  `${API_URL.endsWith("/v1") ? API_URL : `${API_URL}/v1`}${path}`;

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
  const credential = await getRedirectResult(getFirebaseAuth());
  return credential ? exchangeGoogleUser(credential.user) : null;
};

export const restoreExistingGoogleLogin = async () => {
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

export const logoutGoogleUser = async () => {
  await signOut(getFirebaseAuth());
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
