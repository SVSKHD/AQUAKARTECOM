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
