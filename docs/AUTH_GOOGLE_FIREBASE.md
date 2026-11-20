# Aquakart Google Authentication

Credentials are intentionally not committed.

Frontend flow:

1. Sign in with Google using Firebase Authentication.
2. Get the Firebase ID token.
3. Send it to `POST /v1/auth/google` on AQUAKARTBACKEND.
4. Store the returned Aquakart token using the project's existing auth storage convention.
5. Show the backend-provided greeting:
   - New user: `Welcome to Aquakart, <first name>!`
   - Returning user: `Welcome back, <first name>!`

On `/aqua` the first step is Google One Tap (`src/services/googleOneTap.js`,
used by `src/pageComponents/aqua/useAquaAuth.ts`): the in-page FedCM card that
signs in without a popup. It appears on its own for signed-out visitors and when
they press Sign in. Its Google ID token is signed into Firebase with
`signInWithCredential`, so steps 2–5 are unchanged. When Google can't show the
card (no Google session in the browser, recently dismissed, or
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` unset), Sign in falls back to the Firebase popup,
and to a redirect only if popups are blocked. Signing out calls
`disableAutoSelect()` so the shopper isn't signed straight back in.

Staying signed in (`src/context/AuthContext.js`, `src/services/googleAuth.js`):

- The Aquakart session (`userData`, a 30-day JWT) is kept by redux-persist.
  On page load the restore waits for it (up to 1.5 s), then, if Firebase still
  has the same Google account and the token has more than 7 days left, reuses
  it with no call to `POST /auth/google`. The page is usable at once.
- The reused session is confirmed in the background with `GET /auth/me`. If the
  backend refuses it (expired or signed out), a new one is made from the
  Google sign-in Firebase still holds; if Firebase is signed out too, the
  session ends. Offline or server errors keep it.
- Pages that get a 401 can call `refreshSession()` from `useAuth()` for a new
  session without asking the shopper; `/pay/[token]` does this once before
  showing "Your sign-in has expired".

Signing out (`signOutEverywhere` in `src/services/googleAuth.js`, used by
`AuthContext.signOut` and `/aqua`'s `useAquaAuth`): turns off One Tap
auto-select, signs Firebase out, calls `POST /auth/logout` (the backend
records the token as revoked, so it stops working at once; see
AQUAKARTBACKEND `src/services/auth/sessionRevocation.js`) and removes this
tab's per-user data (open Aqua chat, paid-link receipts). Each step runs even
if another fails. `/pay/[token]` shows "Signed in as … · Sign out".

Saved addresses live on the account in the backend (`addresses` and
`selectedAddress` on the user). `POST /auth/google` and `GET /auth/me` both
return them, and edits go through `POST /user/update-details/:id`, which only
accepts the signed-in user's own id and ignores protected fields (role, email,
password and similar). On `/aqua`, `useAccountSync` (`src/pageComponents/aqua/`)
reloads the account from `/auth/me` on open, when the tab is focused again, and
before the profile or checkout opens. That way an address saved on another
device, at checkout or by the team appears without signing in again.

One Tap setup:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: the Web client ID shown under Firebase →
  Authentication → Sign-in method → Google → Web SDK configuration.
- Google Cloud → APIs & Services → Credentials → that client → Authorized
  JavaScript origins: add each site origin (production and `http://localhost:<port>`).

Required public environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (optional; enables One Tap)
