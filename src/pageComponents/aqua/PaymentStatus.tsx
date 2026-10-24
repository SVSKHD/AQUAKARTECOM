"use client";

import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import type { Flow } from "@/utils/aquaFlow";
import {
  PAYMENT_RETURN_MESSAGE,
  waitForCheckoutPayment,
  type ServerOrder,
} from "@/utils/aquaCommerce";

// Where PhonePe sends its window after paying (the storefront).
const siteOrigin = () => {
  try {
    return new URL(process.env.NEXT_PUBLIC_URL || "https://aquakart.co.in")
      .origin;
  } catch {
    return "https://aquakart.co.in";
  }
};
import AquaDroplet from "./AquaDroplet";
import { INR } from "./catalogue";
import type {
  CheckoutDraft,
  FlowDispatch,
  Mood,
  PaymentInfo,
  QuoteState,
} from "./types";

type Props = {
  flow: Flow;
  dispatch: FlowDispatch;
  draft: CheckoutDraft | null;
  quoteState: QuoteState;
  payment: PaymentInfo;
  token: string | null;
  onRetry: () => void;
  onVerified: (order: ServerOrder | null) => void;
  onFailed: (reason: string) => void;
  onDemoPreview: () => void;
  // Clears the conversation and dispatches RESET (same as the header button).
  onNewChat: () => void;
  mood: Mood;
  dark: boolean;
};

const NOT_COMPLETED =
  "PhonePe reported the payment as not completed. If money was debited, it is refunded by your bank.";

const str = (v: unknown) => (v == null ? "" : String(v));
const addressLine = (a: unknown) => {
  if (!a || typeof a !== "object") return "";
  const o = a as Record<string, unknown>;
  return [o.street, o.city, o.state, o.postalCode]
    .map(str)
    .filter(Boolean)
    .join(", ");
};

export default function PaymentStatus({
  flow,
  dispatch,
  draft,
  quoteState,
  payment,
  token,
  onRetry,
  onVerified,
  onFailed,
  onDemoPreview,
  onNewChat,
  mood,
  dark,
}: Props) {
  const pending = flow.state === "payment_pending";
  const [popupClosed, setPopupClosed] = useState(false);
  const checkNowRef = useRef<() => void>(() => {});
  const cbRef = useRef({ onVerified, onFailed });
  useEffect(() => {
    cbRef.current = { onVerified, onFailed };
  }, [onVerified, onFailed]);

  // Live path: poll GET /payments/:id until the server says paid / failed
  // (the PhonePe webhook updates it).
  useEffect(() => {
    if (!pending || !payment.live || !payment.attemptId || !payment.url) return;
    const w = waitForCheckoutPayment(payment.attemptId, token);
    checkNowRef.current = w.checkNow;
    let active = true;
    w.done.then((r) => {
      if (!active) return;
      if (r.status === "paid") cbRef.current.onVerified(r.order);
      else if (r.status === "failed") cbRef.current.onFailed(NOT_COMPLETED);
      else
        cbRef.current.onFailed(
          "We didn't hear back from PhonePe in 15 minutes. If money was debited, the order is confirmed automatically or refunded.",
        );
    });

    // PhonePe sends its window back to the storefront's /order/{txn} page, which
    // tells this tab. That only triggers a check: the server stays the source of truth.
    const trusted = new Set([window.location.origin, siteOrigin()]);
    const onMessage = (e: MessageEvent) => {
      if (!trusted.has(e.origin)) return;
      const d = e.data as { type?: string } | null;
      if (d?.type === PAYMENT_RETURN_MESSAGE) w.checkNow();
    };
    window.addEventListener("message", onMessage);

    // When the PhonePe window closes, check once and offer to stop waiting.
    const watch = setInterval(() => {
      if (payment.popup?.closed) {
        clearInterval(watch);
        setPopupClosed(true);
        w.checkNow();
      }
    }, 1000);

    return () => {
      active = false;
      w.cancel();
      clearInterval(watch);
      window.removeEventListener("message", onMessage);
      setPopupClosed(false);
    };
  }, [
    pending,
    payment.live,
    payment.attemptId,
    payment.url,
    payment.popup,
    token,
  ]);

  const reopen = () => {
    if (!payment.url) return;
    const w = window.open(
      payment.url,
      "aquakart-phonepe",
      "width=480,height=760",
    );
    if (w) setPopupClosed(false);
  };

  const items = draft?.items || [];
  const so = payment.serverOrder;
  const total =
    so?.totalAmount ??
    (quoteState.status === "ready" && !quoteState.demo
      ? quoteState.data.payableAmount
      : null);

  // ---------- confirmed ----------
  if (flow.state === "confirmed") {
    const demo = !payment.live;
    const orderId = demo
      ? payment.demoId
      : str(so?.orderId || so?.transactionId || payment.orderId);
    const serverItems = Array.isArray(so?.items)
      ? (so!.items as Record<string, unknown>[])
      : null;
    const itemLines = serverItems
      ? serverItems.map(
          (i) =>
            `${str(i.name || i.title || "Item")} × ${str(i.quantity || 1)}`,
        )
      : items.map((i) => `${i.title} × ${i.qty}`);
    const addr = demo
      ? addressLine(draft?.address)
      : addressLine(so?.shippingAddress) || addressLine(draft?.address);
    const inst =
      (so?.installation as { day?: string; slot?: string } | undefined) ||
      (draft ? { day: draft.slotDay, slot: draft.slotTime } : undefined);

    return (
      <div
        className="aq-noscroll"
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "76px 20px 28px",
        }}
      >
        <div
          style={{
            maxWidth: 460,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          {demo && (
            <div
              role="note"
              style={{
                width: "100%",
                background: "#FEF3C7",
                color: "#8A5A00",
                borderRadius: 14,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Demo order preview · not a real order
            </div>
          )}
          <div style={{ height: 160, display: "grid", placeItems: "center" }}>
            <AquaDroplet mood={mood} size={120} dark={dark} />
          </div>
          <h2
            className="aq-display"
            style={{ margin: 0, fontSize: 24, fontWeight: 700 }}
          >
            {demo
              ? "This is what your confirmation will look like"
              : "Order confirmed"}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--aq-body)",
            }}
          >
            {demo
              ? "No payment was taken and no order was placed. On the live site this screen appears only after Aquakart's server verifies your PhonePe payment."
              : "Aquakart received your payment. We'll call to confirm the installation slot."}
          </p>
          <dl
            className="aq-card"
            style={{
              width: "100%",
              margin: 0,
              padding: "14px 16px",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "8px 16px",
              fontSize: 14,
              textAlign: "left",
            }}
          >
            <dt style={{ color: "var(--aq-mut)" }}>Order</dt>
            <dd
              className="aq-mono"
              style={{ margin: 0, fontWeight: 700, textAlign: "right" }}
            >
              {orderId}
            </dd>
            <dt style={{ color: "var(--aq-mut)" }}>Items</dt>
            <dd style={{ margin: 0, fontWeight: 600, textAlign: "right" }}>
              {itemLines.join(", ")}
            </dd>
            {total != null && !demo && (
              <>
                <dt style={{ color: "var(--aq-mut)" }}>Paid</dt>
                <dd style={{ margin: 0, fontWeight: 800, textAlign: "right" }}>
                  {INR(Number(total))}
                </dd>
              </>
            )}
            {addr && (
              <>
                <dt style={{ color: "var(--aq-mut)" }}>Deliver to</dt>
                <dd style={{ margin: 0, fontWeight: 600, textAlign: "right" }}>
                  {addr}
                </dd>
              </>
            )}
            {inst?.day && (
              <>
                <dt style={{ color: "var(--aq-mut)" }}>Installation</dt>
                <dd style={{ margin: 0, fontWeight: 600, textAlign: "right" }}>
                  {dayjs(inst.day).isValid()
                    ? dayjs(inst.day).format("ddd D MMM")
                    : inst.day}{" "}
                  · {inst.slot}
                </dd>
              </>
            )}
          </dl>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              className="aq-btn aq-btn-dark"
              onClick={() => dispatch({ type: "CLOSE" })}
            >
              Continue chatting
            </button>
            {flow.productId && (
              <button
                type="button"
                className="aq-btn aq-btn-glass"
                onClick={() =>
                  dispatch({ type: "VIEW", productId: flow.productId })
                }
              >
                View product
              </button>
            )}
            <button
              type="button"
              className="aq-btn aq-btn-ghost"
              onClick={onNewChat}
            >
              New chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- pending / failed ----------
  const failed = flow.state === "payment_failed";
  return (
    <div
      className="aq-noscroll"
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "safe center",
        padding: "76px 20px 28px",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          textAlign: "center",
        }}
      >
        <div style={{ height: 160, display: "grid", placeItems: "center" }}>
          <AquaDroplet mood={mood} size={120} dark={dark} />
        </div>

        {failed ? (
          <>
            <h2
              className="aq-display"
              style={{ margin: 0, fontSize: 24, fontWeight: 700 }}
            >
              Payment not completed
            </h2>
            <p
              role="alert"
              style={{
                margin: 0,
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--aq-body)",
              }}
            >
              {payment.reason || NOT_COMPLETED}
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                className="aq-btn aq-btn-primary"
                onClick={onRetry}
              >
                Retry payment
              </button>
              <button
                type="button"
                className="aq-btn aq-btn-glass"
                onClick={() => dispatch({ type: "EDIT" })}
              >
                Edit details
              </button>
              <button
                type="button"
                className="aq-btn aq-btn-ghost"
                onClick={() => dispatch({ type: "CLOSE" })}
              >
                Close
              </button>
            </div>
          </>
        ) : payment.live ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "2.5px solid var(--aq-mintbd)",
                  borderTopColor: "#008B68",
                  animation: "aqSpin .9s linear infinite",
                }}
              />
              <h2
                className="aq-display"
                role="status"
                style={{ margin: 0, fontSize: 22, fontWeight: 700 }}
              >
                {payment.url ? "Waiting for PhonePe…" : "Opening PhonePe…"}
              </h2>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--aq-body)",
              }}
            >
              Finish the payment in the PhonePe window. This page updates once
              Aquakart&apos;s server confirms it. Keep this tab open.
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                className="aq-btn aq-btn-primary"
                onClick={reopen}
                disabled={!payment.url}
              >
                Reopen payment window
              </button>
              <button
                type="button"
                className="aq-btn aq-btn-glass"
                onClick={() => checkNowRef.current()}
                disabled={!payment.url}
              >
                Check status
              </button>
            </div>
            {popupClosed && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 13,
                  color: "var(--aq-mut)",
                }}
              >
                <span>
                  The PhonePe window was closed. Still waiting for the server.
                </span>
                <button
                  type="button"
                  className="aq-btn aq-btn-ghost"
                  onClick={() =>
                    onFailed(
                      "You closed PhonePe before the payment finished. Nothing is confirmed until Aquakart's server sees the payment.",
                    )
                  }
                >
                  I didn&apos;t finish paying
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <h2
              className="aq-display"
              style={{ margin: 0, fontSize: 22, fontWeight: 700 }}
            >
              Payment preview
            </h2>
            <div
              role="note"
              style={{
                width: "100%",
                border: "1px dashed #B9CFCB",
                borderRadius: 16,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "rgba(var(--aq-gl),.6)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                No payment gateway is connected in this preview.
              </span>
              <span
                className="aq-mono"
                style={{ fontSize: 11, color: "var(--aq-mut)" }}
              >
                Nothing is charged or verified
              </span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="aq-btn aq-btn-primary"
                  onClick={onDemoPreview}
                  style={{ flex: 1 }}
                >
                  Preview confirmation
                </button>
                <button
                  type="button"
                  className="aq-btn aq-btn-glass"
                  onClick={() =>
                    onFailed(
                      "Demo: this shows how a failed payment looks. Nothing was charged.",
                    )
                  }
                  style={{ flex: 1 }}
                >
                  Show failure
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
