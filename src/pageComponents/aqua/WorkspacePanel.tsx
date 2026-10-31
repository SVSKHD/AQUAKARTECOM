"use client";

import type { Dispatch, SetStateAction } from "react";
import { ArrowLeft, X } from "lucide-react";
import {
  isPaymentLocked,
  type Flow,
  type FlowActionType,
} from "@/utils/aquaFlow";
import type { ServerOrder } from "@/utils/aquaCommerce";
import ComparePanel from "./ComparePanel";
import ShopPanel, { type ShopUi } from "./ShopPanel";
import ProductDetail from "./ProductDetail";
import InlineCheckout from "./InlineCheckout";
import type { ActiveCoupon } from "./coupons";
import type { EmailAuth } from "./useAquaAuth";
import PaymentStatus from "./PaymentStatus";
import type {
  Address,
  CheckoutDraft,
  FlowDispatch,
  Mood,
  PaymentInfo,
  Product,
  PayMethod,
  QuoteState,
  Selection,
} from "./types";

export type WorkspacePanelProps = {
  flow: Flow;
  dispatch: FlowDispatch;
  product: Product | null;
  selection: Selection;
  onSelection: (patch: Partial<Selection>) => void;
  reason?: string;
  isFav: boolean;
  inCart: boolean;
  inCompare: boolean;
  onAddToCart: (id: string, qty: number) => void;
  onToggleFav: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onBuy: () => void;
  // The comparison artifact (flow state "compare").
  compared: Product[];
  // The open product came from the comparison: its back button returns there.
  fromComparison: boolean;
  onViewCompared: (id: string) => void;
  onBuyCompared: (id: string) => void;
  // The shop artifact (flow state "shop"): the whole catalogue.
  shop: {
    products: Product[];
    loading: boolean;
    favs: string[];
    cart: string[];
    canView: boolean;
    onView: (id: string) => void;
    onBuy: (id: string) => void;
    onAddToCart: (id: string) => void;
    onToggleFav: (id: string) => void;
    ui: ShopUi;
    onUi: (patch: Partial<ShopUi>) => void;
    onCompare: (ids: string[]) => void;
  };
  // Aqua is answering in the chat (the comparison's "which suits me" loader).
  chatBusy: boolean;
  // The comparison was started from the shop: its back button returns there.
  compareFromShop: boolean;
  // The open product came from the shop: its back button returns there.
  fromShop: boolean;
  onAsk: (text: string) => void;
  draft: CheckoutDraft | null;
  setDraft: Dispatch<SetStateAction<CheckoutDraft | null>>;
  savedAddresses: Address[];
  coupons: ActiveCoupon[];
  categoryOf: (productId: string) => string;
  quoteState: QuoteState;
  setQuoteState: Dispatch<SetStateAction<QuoteState>>;
  commerceLive: boolean;
  catalogueLive: boolean;
  signedIn: boolean;
  token: string | null;
  onPay: () => void;
  onSignIn: () => void;
  // Checkout's sign-in with a one-time code by email.
  emailAuth?: EmailAuth;
  authBusy?: boolean;
  defaultAddress?: Address | null;
  onSaveAddress?: (address: Address) => Promise<Address>;
  onRetry: () => void;
  onRetryWith: (method: PayMethod) => void;
  onRecheck: () => void;
  rechecking: boolean;
  onPaymentCheck: (status: PaymentInfo["serverStatus"]) => void;
  payment: PaymentInfo;
  onVerified: (order: ServerOrder | null) => void;
  onFailed: (reason: string, unconfirmed?: boolean) => void;
  onDemoPreview: () => void;
  onNewChat: () => void;
  onViewOrders?: () => void;
  // Sheet layouts: close the panel and focus the chat input.
  onChat?: () => void;
  mood: Mood;
  dark: boolean;
  isMobile: boolean;
};

const STEPS = [
  { label: "Product", states: ["shop", "compare", "product"] },
  { label: "Checkout", states: ["checkout"] },
  { label: "Payment", states: ["payment_pending", "payment_failed"] },
  { label: "Done", states: ["confirmed"] },
];

// Right-hand panel (desktop) / bottom sheet (mobile). Contents switch on flow.state only.
export default function WorkspacePanel(props: WorkspacePanelProps) {
  const { flow, dispatch, draft } = props;
  const locked = isPaymentLocked(flow);

  let back: { label: string; action: FlowActionType } | null = null;
  if (flow.state === "product")
    back = props.fromComparison
      ? { label: "Back to comparison", action: "BACK" }
      : props.fromShop
        ? { label: "Back to shop", action: "SHOP" }
        : { label: "Back to chat", action: "CLOSE" };
  else if (flow.state === "compare" && props.compareFromShop)
    back = { label: "Back to shop", action: "SHOP" };
  else if (flow.state === "compare" || flow.state === "shop")
    back = { label: "Back to chat", action: "CLOSE" };
  else if (flow.state === "checkout")
    back =
      draft?.source === "buy" && flow.productId
        ? { label: "Back to product", action: "BACK" }
        : { label: "Back to chat", action: "CLOSE" };
  else if (flow.state === "payment_failed")
    back = { label: "Back to chat", action: "CLOSE" };
  else if (flow.state === "confirmed")
    back = { label: "Continue chatting", action: "CLOSE" };

  const current = STEPS.findIndex((s) => s.states.includes(flow.state));
  const pad = props.isMobile ? 12 : 12;

  return (
    <div
      className="aq-panel"
      style={{
        position: "absolute",
        inset: 0,
        minWidth: props.isMobile ? 0 : 340,
      }}
    >
      {/* No bar: each control floats as its own glass piece over the
          content, which stays visible (blurred) only behind them. */}
      <div className="aq-pbar" style={{ top: pad, left: pad, right: pad }}>
        {back ? (
          <button
            type="button"
            className="aq-pbar-glass aq-pbar-back"
            onClick={() => dispatch({ type: back.action })}
          >
            <ArrowLeft size={16} aria-hidden="true" /> {back.label}
          </button>
        ) : (
          <span className="aq-pbar-glass aq-pbar-note">
            Payment in progress
          </span>
        )}
        {!props.isMobile && (
          <ol
            aria-label="Progress"
            className="aq-steps aq-pbar-glass"
            style={{
              display: "flex",
              gap: 4,
              alignItems: "center",
              listStyle: "none",
              margin: 0,
              padding: 4,
            }}
          >
            {STEPS.map((s, i) => (
              <li
                key={s.label}
                aria-current={i === current ? "step" : undefined}
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  background:
                    i === current
                      ? "rgba(7,26,37,.8)"
                      : i < current
                        ? "var(--aq-mint)"
                        : "transparent",
                  color:
                    i === current
                      ? "#fff"
                      : i < current
                        ? "var(--aq-mintink)"
                        : "var(--aq-mut2)",
                }}
              >
                {s.label}
              </li>
            ))}
          </ol>
        )}
        {!locked && (
          <button
            type="button"
            className="aq-pbar-glass aq-pbar-close"
            onClick={() => dispatch({ type: "CLOSE" })}
            aria-label="Close panel"
          >
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>

      {flow.state === "product" && props.product && (
        <ProductDetail
          key={props.product.id}
          product={props.product}
          selection={props.selection}
          onSelection={props.onSelection}
          reason={props.reason}
          isFav={props.isFav}
          inCart={props.inCart}
          inCompare={props.inCompare}
          onAddToCart={props.onAddToCart}
          onToggleFav={props.onToggleFav}
          onToggleCompare={props.onToggleCompare}
          onBuy={props.onBuy}
          onAsk={props.onAsk}
          onChat={
            props.onChat &&
            (() => {
              dispatch({ type: "CLOSE" });
              props.onChat?.();
            })
          }
          onClose={props.onChat && (() => dispatch({ type: "CLOSE" }))}
          dark={props.dark}
          isMobile={props.isMobile}
        />
      )}
      {flow.state === "compare" && (
        <ComparePanel
          products={props.compared}
          onView={props.onViewCompared}
          onBuy={props.onBuyCompared}
          onAsk={props.onAsk}
          chatBusy={props.chatBusy}
          onViewAnswer={() => dispatch({ type: "CLOSE" })}
        />
      )}
      {flow.state === "shop" && (
        <ShopPanel
          {...props.shop}
          live={props.catalogueLive}
          onAsk={props.onAsk}
        />
      )}
      {flow.state === "product" && !props.product && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "var(--aq-mut)",
            fontSize: 14,
          }}
        >
          This product isn&apos;t in the catalogue any more.
        </div>
      )}
      {flow.state === "checkout" && draft && (
        <InlineCheckout
          draft={draft}
          setDraft={props.setDraft}
          savedAddresses={props.savedAddresses}
          coupons={props.coupons}
          categoryOf={props.categoryOf}
          quoteState={props.quoteState}
          setQuoteState={props.setQuoteState}
          commerceLive={props.commerceLive}
          catalogueLive={props.catalogueLive}
          signedIn={props.signedIn}
          token={props.token}
          onPay={props.onPay}
          onSignIn={props.onSignIn}
          emailAuth={props.emailAuth}
          authBusy={props.authBusy}
          defaultAddress={props.defaultAddress}
          onSaveAddress={props.onSaveAddress}
        />
      )}
      {(flow.state === "payment_pending" ||
        flow.state === "payment_failed" ||
        flow.state === "confirmed") && (
        <PaymentStatus
          flow={flow}
          dispatch={dispatch}
          draft={draft}
          quoteState={props.quoteState}
          payment={props.payment}
          token={props.token}
          onRetry={props.onRetry}
          onRetryWith={props.onRetryWith}
          onRecheck={props.onRecheck}
          rechecking={props.rechecking}
          onPaymentCheck={props.onPaymentCheck}
          onVerified={props.onVerified}
          onFailed={props.onFailed}
          onDemoPreview={props.onDemoPreview}
          onNewChat={props.onNewChat}
          onViewOrders={props.onViewOrders}
          mood={props.mood}
          dark={props.dark}
        />
      )}
    </div>
  );
}
