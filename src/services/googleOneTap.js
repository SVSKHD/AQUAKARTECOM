// Google One Tap (FedCM in Chrome): the "Sign in to aquakart with google.com"
// card that signs a shopper in from the page itself, without a popup window.
// The Google ID token it returns is turned into a Firebase session, so the rest
// of sign-in (backend exchange, sign-out, restore) is unchanged.
//
// Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID: the Web client ID Firebase created for the
// Google provider (Firebase → Authentication → Google → Web SDK configuration),
// with this site listed under its Authorized JavaScript origins.

const GIS_SRC = "https://accounts.google.com/gsi/client";

export const googleClientId = () =>
  (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

export const isOneTapConfigured = () =>
  typeof window !== "undefined" && !!googleClientId();

let gisLoading = null;
const loadGis = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  gisLoading ||= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () =>
      window.google?.accounts?.id
        ? resolve(window.google)
        : reject(new Error("Google sign-in didn't load"));
    script.onerror = () => {
      gisLoading = null;
      reject(new Error("Couldn't reach Google. Check your connection."));
    };
    document.head.appendChild(script);
  });
  return gisLoading;
};

// GIS wants one initialize() per page; each prompt swaps in its own handler.
let initialized = false;
// Settles the open prompt: with a Google ID token, or null when it went away.
let onCredential = null;
// The card already on screen: a second prompt waits on it instead.
let pending = null;

const ensureInitialized = async () => {
  const google = await loadGis();
  if (!initialized) {
    google.accounts.id.initialize({
      client_id: googleClientId(),
      callback: (response) => onCredential?.(response?.credential || ""),
      // Returning shoppers with one Google account are signed straight in.
      auto_select: true,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: true,
      use_fedcm_for_prompt: true,
    });
    initialized = true;
  }
  return google.accounts.id;
};

// Shows the One Tap card. Resolves with a Google ID token, or null when Google
// didn't show it (no Google session, dismissed recently, browser opted out) or
// the shopper closed it, so the caller can fall back to the regular sign-in.
export const promptGoogleOneTap = () => {
  if (!isOneTapConfigured()) return Promise.resolve(null);
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      onCredential = null;
      pending = null;
      resolve(value);
    };
    onCredential = (credential) => done(credential || null);
    ensureInitialized().then(
      // Cancelled while the script loaded: don't show a card nobody wants.
      (id) => !settled && id.prompt(onMoment),
      (error) => {
        onCredential = null;
        pending = null;
        reject(error);
      },
    );
    const onMoment = (moment) => {
      if (moment?.isNotDisplayed?.() || moment?.isSkippedMoment?.()) done(null);
      else if (
        moment?.isDismissedMoment?.() &&
        moment.getDismissedReason?.() !== "credential_returned"
      )
        done(null);
    };
  });
  return pending;
};

export const cancelGoogleOneTap = () => {
  window.google?.accounts?.id?.cancel();
  onCredential?.(null);
};

// After signing out, don't let auto_select sign the shopper straight back in.
export const disableGoogleAutoSelect = () => {
  window.google?.accounts?.id?.disableAutoSelect();
};
