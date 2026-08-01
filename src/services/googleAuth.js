import { signInWithPopup, signOut } from "firebase/auth";
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

export const loginWithGoogle = async () => {
  const firebaseAuth = getFirebaseAuth();
  const credential = await signInWithPopup(firebaseAuth, getGoogleProvider());
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

export const logoutGoogleUser = async () => {
  await signOut(getFirebaseAuth());
};

export const getCurrentFirebaseIdToken = async () => {
  const currentUser = getFirebaseAuth().currentUser;
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
