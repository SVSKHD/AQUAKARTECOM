import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const authUrl = (path) =>
  `${API_URL.endsWith("/v1") ? API_URL : `${API_URL}/v1`}${path}`;

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Google authentication failed");
  }

  return data;
};

const exchangeGoogleCredential = async (credential) => {
  const firebaseAuth = getFirebaseAuth();
  const firebaseIdToken = await credential.user.getIdToken();

  const response = await fetch(authUrl("/auth/google"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firebaseIdToken}`,
      "Content-Type": "application/json",
    },
  });

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
    return exchangeGoogleCredential(credential);
  } catch (error) {
    if (!shouldUseRedirectFallback(error)) throw error;
    await signInWithRedirect(firebaseAuth, getGoogleProvider());
    return { redirecting: true };
  }
};

export const completeGoogleRedirectLogin = async () => {
  const credential = await getRedirectResult(getFirebaseAuth());
  return credential ? exchangeGoogleCredential(credential) : null;
};

export const logoutGoogleUser = async () => {
  await signOut(getFirebaseAuth());
};

export const getCurrentFirebaseIdToken = async () => {
  const firebaseAuth = getFirebaseAuth();
  await firebaseAuth.authStateReady?.();
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) {
    throw new Error("Please continue with Google first");
  }
  return currentUser.getIdToken(true);
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
