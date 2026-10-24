"use client";

import type { Dispatch, SetStateAction } from "react";
import { ArrowLeft, X } from "lucide-react";
import {
  isPaymentLocked,
  type Flow,
  type FlowActionType,
} from "@/utils/aquaFlow";
import type { ServerOrder } from "@/utils/aquaCommerce";
import ProductDetail from "./ProductDetail";
import InlineCheckout from "./InlineCheckout";
import PaymentStatus from "./PaymentStatus";
import type {
  Address,
  CheckoutDraft,
  FlowDispatch,
  Mood,
  PaymentInfo,
  Product,
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
  onAsk: (text: string) => void;
  draft: CheckoutDraft | null;
  setDraft: Dispatch<SetStateAction<CheckoutDraft | null>>;
  savedAddresses: Address[];
  quoteState: QuoteState;
  setQuoteState: Dispatch<SetStateAction<QuoteState>>;
  commerceLive: boolean;
  catalogueLive: boolean;
  signedIn: boolean;
  token: string | null;
  onPay: () => void;
  onRetry: () => void;
  payment: PaymentInfo;
  onVerified: (order: ServerOrder | null) => void;
  onFailed: (reason: string) => void;
  onDemoPreview: () => void;
  onNewChat: () => void;
  mood: Mood;
  dark: boolean;
  isMobile: boolean;
};

const STEPS = [
  { label: "Product", states: ["product"] },
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
      <div
        className="aq-glass"
        style={{
          position: "absolute",
          top: pad,
          left: pad,
          right: pad,
          zIndex: 4,
          height: 48,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 6px",
          borderRadius: 16,
          background: "rgba(var(--aq-gl),.42)",
        }}
      >
        {back ? (
          <button
            type="button"
            className="aq-btn aq-btn-glass"
            onClick={() => dispatch({ type: back.action })}
            style={{ height: 36, padding: "0 12px 0 8px", fontSize: 12.5 }}
          >
            <ArrowLeft size={16} /> {back.label}
          </button>
        ) : (
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--aq-mut)",
              paddingLeft: 8,
            }}
          >
            Payment in progress
          </span>
        )}
        <div style={{ flex: 1 }} />
        {!props.isMobile && (
          <ol
            aria-label="Progress"
            className="aq-steps"
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              listStyle: "none",
              margin: 0,
              padding: 0,
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
            className="aq-icon-btn"
            onClick={() => dispatch({ type: "CLOSE" })}
            aria-label="Close panel"
          >
            <X size={16} />
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
          dark={props.dark}
          isMobile={props.isMobile}
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
          quoteState={props.quoteState}
          setQuoteState={props.setQuoteState}
          commerceLive={props.commerceLive}
          catalogueLive={props.catalogueLive}
          signedIn={props.signedIn}
          token={props.token}
          onPay={props.onPay}
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
          onVerified={props.onVerified}
          onFailed={props.onFailed}
          onDemoPreview={props.onDemoPreview}
          onNewChat={props.onNewChat}
          mood={props.mood}
          dark={props.dark}
        />
      )}
    </div>
  );
}
