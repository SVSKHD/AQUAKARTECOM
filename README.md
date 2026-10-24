# AquaKart Ecom

Customer storefront built with Next.js, React, Redux, and Firebase authentication.

## Project guides

- [AGENTS.md](AGENTS.md): compact starting context and coding conventions for new chats.
- [App context and stack](docs/APP_CONTEXT.md): feature map, architecture, integrations.
- [Development guide](docs/DEVELOPMENT.md): setup, environment modes, checks, troubleshooting.
- [Google authentication](docs/AUTH_GOOGLE_FIREBASE.md): sign-in configuration.

## Run locally

Install dependencies with `npm install`, copy `.env.example` to `.env.local`, and configure required values. `MODE=dev` selects `http://localhost:5300/v1`; `MODE=prod` selects the live API. Start the backend separately for dev mode.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000)
