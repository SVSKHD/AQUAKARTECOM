import { signInWithPopup, signOut } from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Google authentication failed");
  }

  return data;
};

export const loginWithGoogle = async () => {
  const credential = await signInWithPopup(firebaseAuth, googleProvider);
  const firebaseIdToken = await credential.user.getIdToken();

  const response = await fetch(`${API_URL}/v1/auth/google`, {
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
  await signOut(firebaseAuth);
};
