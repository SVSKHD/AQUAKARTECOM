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

Required public environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_API_URL`
