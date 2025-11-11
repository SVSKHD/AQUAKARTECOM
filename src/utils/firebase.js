import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBuwVR1W0IvDDpnhAWJP8dJGcoq-glEZug",
  authDomain: "aquakart-water-solutions.firebaseapp.com",
  projectId: "aquakart-water-solutions",
  storageBucket: "aquakart-water-solutions.firebasestorage.app",
  messagingSenderId: "506182510679",
  appId: "1:506182510679:web:a662dff532953d27185b12",
  measurementId: "G-G56GVYMQLK",
};

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(firebaseApp);
      }
    })
    .catch(() => {
      // Analytics is optional; ignore if unsupported
    });
}

let authInstance;
export const getFirebaseAuth = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!authInstance) {
    authInstance = getAuth(firebaseApp);
    authInstance.useDeviceLanguage();
  }

  return authInstance;
};

let recaptchaVerifier;
export const initializeRecaptchaVerifier = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return null;
  }

  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, "firebase-recaptcha", {
    size: "invisible",
  });

  return recaptchaVerifier;
};

export const clearRecaptchaVerifier = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};

export { firebaseApp, signInWithPhoneNumber };
