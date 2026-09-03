import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
} from "firebase/auth";

const CONFIG_ENV_KEYS = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

// Only these are required to sign a user in; the rest are optional extras.
const REQUIRED_CONFIG_KEYS = ["apiKey", "authDomain", "projectId", "appId"];

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const missingFirebaseConfigKeys = () =>
  REQUIRED_CONFIG_KEYS.filter((key) => !firebaseConfig[key]).map(
    (key) => CONFIG_ENV_KEYS[key],
  );

export const isFirebaseConfigured = () =>
  missingFirebaseConfigKeys().length === 0;

let firebaseAuthInstance;

const getFirebaseApp = () => {
  const missing = missingFirebaseConfigKeys();
  if (missing.length) {
    throw new Error(
      `Firebase is not configured. Add ${missing.join(", ")} to .env.local and restart the dev server.`,
    );
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
};

export const getFirebaseAuth = () => {
  const app = getFirebaseApp();
  if (firebaseAuthInstance) return firebaseAuthInstance;

  try {
    firebaseAuthInstance = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  } catch {
    firebaseAuthInstance = getAuth(app);
  }

  return firebaseAuthInstance;
};
export const getGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
};

export default getFirebaseApp;
