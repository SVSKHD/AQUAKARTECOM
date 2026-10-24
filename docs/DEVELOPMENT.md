# Development and troubleshooting

## Local setup

1. Install dependencies with `npm install`. Both npm and pnpm lockfiles exist; preserve the lockfile convention used by the task and avoid incidental dependency updates.
2. Copy `.env.example` to `.env.local` and fill only needed settings. Existing `.env` values may already be present; do not overwrite them blindly.
3. Set `MODE=dev` for the local backend and start that backend separately on port 5300.
4. Run `npm run dev`; the storefront normally opens at `http://localhost:3000`.

On Windows, `npm.cmd` and `npx.cmd` work when PowerShell blocks the `.ps1` wrappers.

## Environment

| Setting                  | Behavior                                                       |
| ------------------------ | -------------------------------------------------------------- |
| `MODE=dev`               | API base `http://localhost:5300/v1`                            |
| `MODE=prod`              | API base `https://api.aquakart.co.in/v1`                       |
| MODE unset               | Defaults to prod; other values throw a configuration error     |
| `INVOICE_API_URL`        | Optional server-side invoice backend override                  |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase public app configuration; names are in `.env.example` |
| `ANALYZE=true`           | Enables Next bundle analyzer                                   |

`next.config.mjs` supplies `NEXT_PUBLIC_API_URL` from MODE, overriding a separately supplied value for this config entry. The same base drives backend proxy and merchant feed rewrites. MODE controls the backend target, independently of `NODE_ENV`.

Restart development after env changes. Public client values are fixed at build time; set production values before building and rebuild when changing targets. Next.js env precedence puts `.env.local` ahead of `.env` (environment-specific files and process variables can also take precedence).

Docker currently declares public API and Firebase build arguments but does not declare a MODE build argument. It copies the source before building. Ensure files copied into a production image do not accidentally select `MODE=dev`; verify deployment env handling before changing that workflow.

For Google login setup, see [AUTH_GOOGLE_FIREBASE.md](AUTH_GOOGLE_FIREBASE.md). That guide lists `NEXT_PUBLIC_API_URL` as required for the flow; this app now derives it from MODE. Firebase must authorize localhost for local Google login. Never put backend credentials in `NEXT_PUBLIC_*` variables.

## Commands

| Command                                    | Purpose                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `npm run dev`                              | Next development using Webpack                                            |
| `npm run build`                            | Production build using Turbopack                                          |
| `npm start`                                | Serve an existing production build                                        |
| `npm test`                                 | Run Vitest suite once                                                     |
| `npm test -- src/utils/priceUtils.test.js` | Run one relevant test file                                                |
| `npm run test:watch`                       | Watch tests                                                               |
| `npm run test:coverage`                    | Coverage; current coverage include targets UI primitives                  |
| `npm run lint`                             | Repository ESLint check                                                   |
| `npx eslint src/path/to/changed-file.js`   | Focused lint check                                                        |
| `npx tsc --noEmit --incremental false`     | TS check without writing incremental cache; no dedicated typecheck script |
| `npm run pretty`                           | Formats the whole repo; prefer targeted formatting for small changes      |

Vitest uses jsdom, `vitest.setup.js`, and discovers `src/**/*.{test,spec}.{js,jsx,ts,tsx}`. Keep useful regression tests beside related code. Do not claim a successful check without running it; pre-existing errors may prevent a full build or type check.

## Fast diagnosis

| Symptom                                         | First checks                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| Requests go to the wrong backend                | MODE, env precedence, `next.config.mjs`, restart/rebuild                             |
| Local API unavailable                           | Backend running on 5300, `/v1` path, CORS and authentication                         |
| `.map is not a function`                        | Response envelope vs actual array; unwrap and validate at the request/state boundary |
| Hydration mismatch or dialogs reopen            | Browser storage access, `_app.js` persistence timing and blacklist                   |
| Google `auth/invalid-api-key`                   | Firebase env values, build-time config, authorized domains                           |
| Invoice gateway reaches Express unexpectedly    | Internal gateway rewrite ordering vs generic `/api` proxy                            |
| Next API or routing confusion                   | Read the relevant installed guide under `node_modules/next/dist/docs/`               |
| Error points to localhost:4000 / Vite CRM files | Investigate `../AQUACRM25DEV`, not storefront routes                                 |

## Keep future chats small

Start with `AGENTS.md`, then one relevant doc section and the actual feature entry point. Include exact failing command/route and expected behavior in handoffs. Record lasting architecture or workflow changes here; avoid storing secrets, terminal dumps, transient task history, or claims that checks always pass.
