# Aqua workspace (POC · TypeScript · App Router)

The Aquakart AI shopping flow on **one mounted page**: chat, product, checkout and
payment all happen inside `AquaWorkspace` without changing the URL.

- Route: `/aqua` → `src/app/aqua/page.tsx` (App Router). The rest of the site is still the
  Pages Router (`src/pages`). The two live side by side; `src/app/layout.tsx` only wraps App Router routes.
- PhonePe return: `/payment-return` → `src/app/payment-return/page.tsx`, opened only inside the PhonePe popup.
- Reference design: `Aqua Landing v4.dc.html` (tokens, droplet and glass surfaces are ported into `aqua.css`, `AquaDroplet.tsx` and `ThemeLayer.tsx`).

## Flow states

All panel and step changes go through `dispatch({ type })` on `flowReducer`
(`src/utils/aquaFlow.ts`). Anything not listed for the current state is ignored, and a
dev-only console warning is logged.

| State             | Panel                  | Allowed actions                                                 |
| ----------------- | ---------------------- | --------------------------------------------------------------- |
| `welcome`         | closed                 | `SEND` → chatting, `VIEW` → product, `CHECKOUT_CART` → checkout |
| `chatting`        | closed                 | `VIEW`, `CHECKOUT_CART`, `RESUME` (→ parked step), `RESET`      |
| `product`         | product detail         | `VIEW` (swap), `BUY`, `CHECKOUT_CART`, `CLOSE`, `RESET`         |
| `checkout`        | inline checkout        | `BACK`, `VIEW`, `PAY`, `CLOSE` (parks), `RESET`                 |
| `payment_pending` | payment status, locked | `VERIFIED`, `FAILED`, `DEMO_PREVIEW`                            |
| `payment_failed`  | payment status         | `RETRY`, `EDIT`, `VIEW`, `CLOSE` (parks), `RESET`               |
| `confirmed`       | confirmation           | `VIEW`, `CLOSE`, `RESET`                                        |

Chat history, cart and favourites live outside the machine and are never reset by it.
Cart and favourites use the existing Redux `cartData` / `favData` slices (same persist key
as `pages/_app.js`), so the rest of the site stays in sync.

## Components

```
AquaApp                  Redux provider + client-only mount
└─ AquaWorkspace         useReducer(flowReducer); selections, checkout draft, payment
   ├─ ThemeLayer         background rays, sun/moon, waves, bubbles
   ├─ AquaHeader         logo (RESET), theme, favourites, cart, new chat
   ├─ HistoryDock        overlay: earlier chats, products opened
   ├─ Conversation       always mounted; welcome hero, messages, cards, compare table
   │  └─ Composer        always mounted and enabled
   ├─ WorkspacePanel     desktop column (draggable divider) / mobile bottom sheet
   │  ├─ ProductDetail
   │  ├─ InlineCheckout
   │  └─ PaymentStatus   pending / failed / confirmed
   ├─ ShopPopover        cart + favourites
   └─ AquaDroplet        mood derived from chat status + flow.state
```

## Payment rules

- **Live** (live catalogue + signed-in token): `/v1/checkout/quote` → `/order/pay` →
  PhonePe in a popup (opened synchronously in the click handler) → poll
  `/order/transaction-id/:id`. `confirmed` is reached only when that returns paid.
- **Demo** (no token or demo catalogue): the panel says no gateway is connected;
  "Preview confirmation" shows a screen labelled "Demo order preview · not a real order".
- Nothing ever renders "verified" from client state alone.

## Backend still needed

- PIN serviceability endpoint (replaces `src/services/delivery.ts`).
- Offers endpoint for festive codes (coupons are validated by the quote endpoint today).
- Hardness data by city or PIN (replaces the estimates in `HardnessCard.tsx`).
- PhonePe redirect URL → `https://aquakart.co.in/payment-return?transactionId=<id>`.
