# AquaKart Ecom: agent quick start

This repository is the customer storefront, not the standalone CRM or Express backend.
Read this file first; open only the task-relevant docs and source files to conserve context.

## Start here

- [Architecture and stack](docs/APP_CONTEXT.md): route ownership, features, state, integrations.
- [Run and troubleshoot](docs/DEVELOPMENT.md): environment, commands, validation, common problems.
- [Google authentication](docs/AUTH_GOOGLE_FIREBASE.md): Firebase/backend sign-in flow.
- Source and package/config files are authoritative when documentation differs. Update these docs when changing architecture, environment behavior, or commands.

## Working conventions

- Inspect `git status --short` before edits; preserve unrelated work. Scope changes to this repository unless the task explicitly concerns a sibling project.
- Search specific directories with `rg`; avoid loading the whole repository or all docs at session start. Exclude dependencies, build output, and lockfiles from broad searches.
- Mixed JavaScript and TypeScript are intentional. Follow nearby patterns and use the `@/` alias for `src/`. Do not migrate routers or state libraries as part of routine fixes.
- Pages Router entry: `src/pages/_app.js`. App Router entry: `src/app/layout.tsx`. Check which owns the route before changing providers or navigation.
- API calls belong in `src/services`; API base selection belongs in `next.config.mjs`. Preserve the `/v1` prefix. Check actual response shapes before storing lists in state.
- Preserve SSR hydration: access browser storage after mount; keep transient UI state out of Redux persistence. The assistant mounts globally to survive Pages Router navigation.
- Keep secrets out of code, docs, and output. Use `.env.example` for variable names and examples.
- Run checks appropriate to the change. Prefer focused Vitest tests and lint on changed code; use a production build for routing/config changes when practical. Report pre-existing failures separately. Documentation-only changes need link/path checks, not an app build.
- On Windows PowerShell, use `npm.cmd` / `npx.cmd` if script execution policy blocks `npm.ps1`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
