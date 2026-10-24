# App context and stack

Verified against repository files on 2026-10-24. Read only relevant sections; confirm current behavior in source before editing.

## Product and boundaries

AquaKart Ecom is the customer website for water-treatment products, shopping, checkout, orders, invoices, service-related pages, and an AI shopping assistant. The production site is `https://aquakart.co.in`.

Sibling repositories under the parent AQUA directory include `AQUAKARTBACKEND` (backend) and `AQUACRM25DEV` (standalone CRM). A Vite error on localhost:4000 referencing `NotificationsTab.tsx` belongs to the CRM, not this Next.js app. Database models and MongoDB index warnings should be investigated in the backend.

## Stack

Versions below are declared ranges from `package.json`, not a guarantee of installed versions.

| Area                 | Tools                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework            | Next.js ^16.3.6; React / React DOM ^19.3.0                                                                             |
| Language             | JavaScript / JSX and TypeScript ^5.9.3; strict TS, JS checking disabled                                                |
| Routing              | Primarily Pages Router; App Router for `/` (the Aqua home) and `/payment-return`. `/aqua` permanently redirects to `/` |
| State                | Redux ^5, React Redux ^9, Redux Persist ^6; React context                                                              |
| Styling / UI         | Tailwind CSS ^4, CSS modules, global CSS, Headless UI, Framer Motion, Sonner                                           |
| HTTP / auth          | Axios ^1; Firebase ^12 Google authentication plus backend sessions                                                     |
| Other UI             | Embla, Swiper; Lucide, Heroicons, React Icons; jsPDF for PDF generation                                                |
| Verification         | Vitest ^4, jsdom, Testing Library; ESLint ^10, Prettier ^3                                                             |
| Runtime / deployment | Docker defaults to Node 22 Alpine; PM2 runs `next start` on port 3000                                                  |

## Where to change things

| Task                        | Start here                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Route, SSR data, metadata   | `src/pages/`; App Router routes in `src/app/`                                                                         |
| Feature page UI             | `src/pageComponents/` (home, shop, products, checkout, orders, invoice, user, aqua, softenerPlanning)                 |
| Shared UI                   | `src/components/`; common primitives in `src/components/ui/`                                                          |
| HTTP requests               | `src/services/` (products, user, order, invoice, googleAuth, ai, delivery, analyticsTracker, etc.)                    |
| State / dialogs / cart      | `src/store/index.js`, `src/store/reducers/`                                                                           |
| Session / Google sign-in    | `src/context/AuthContext.js`, `src/services/googleAuth.js`, `src/lib/`                                                |
| Assistant                   | `src/components/assistant/`, `src/services/ai.ts`, `src/store/reducers/assistantReducer.js`, `src/utils/assistant.js` |
| Aqua experience (home page) | `src/app/page.tsx`, `src/pageComponents/aqua/`, `src/utils/aquaFlow.ts`, `src/utils/aquaCommerce.ts`                  |
| Invoice access / PDF        | `src/pages/api/`, `src/utils/server/invoiceAccess.js`, `src/utils/invoice/`, `src/services/invoice.js`                |
| Styling                     | `src/styles/`, Tailwind/PostCSS configs                                                                               |
| SEO / sitemap               | `src/config/publicSeoPages.js`, `src/pages/sitemap.xml.js`, `src/pages/seo-manifest.json.js`, `_document.js`          |
| Static assets               | `public/`; existing source assets directory is spelled `src/assests/`                                                 |

## State and request behavior

`src/pages/_app.js` creates the Redux store and Redux Persist setup, adds auth, route loading, analytics, toast UI, and the browser-only assistant. Persistence starts after mount to keep initial server/client renders consistent. UI flags and assistant state are blacklisted from persistence. Reducer keys are defined in `src/store/index.js`.

The assistant is a floating panel by default. A page can host it differently by setting `assistant.context` through `setAssistantContext` from `src/utils/assistant.js`, and must clear it with `null` on unmount. The public invoice/receipt page (`/invoice/[id]`) uses `variant: "drawer"`: a full-height right drawer with questions about the purchased products and a "Products for you" tab fed by `src/utils/invoice/recommendProducts.js`. On that page the floating button is hidden and chat opens from the page's own buttons.

App Router routes use their own root layout and feature providers; do not assume `_app.js` wraps them. The alias `@/*` resolves to `src/*` in TypeScript and Vitest config.

Services generally read `process.env.NEXT_PUBLIC_API_URL`; response handling varies by endpoint. Inspect a service and its backend contract before assuming Axios `response.data` is the final list or object.

`next.config.mjs` selects the API base using `MODE`. It also rewrites `/api/:path*` to the backend and `/google-products.xml` to the merchant feed. `/invoice-gateway/:path*` targets the internal invoice API so invoice authentication stays on the Next.js server. Preserve that distinction.
