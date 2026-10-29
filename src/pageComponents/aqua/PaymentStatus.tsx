"use client";

import { useEffect, useRef, useState } from "react";
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
import CodConfirmation from "./CodConfirmation";
import { INR } from "./catalogue";
import { installationLabel } from "./orders";
import {
  LoadingButton,
  OrderStatusCard,
  PaymentHelp,
  PaymentTimeline,
  type Step,
  type Tone,
} from "./PaymentParts";
import type {
  CheckoutDraft,
  FlowDispatch,
  Mood,
  PayMethod,
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
  // Retry with the other payment method (cash on delivery / online).
  onRetryWith: (method: PayMethod) => void;
  // One more GET /payments/:id from the failed / not-confirmed screen.
  onRecheck: () => void;
  rechecking: boolean;
  onPaymentCheck: (status: PaymentInfo["serverStatus"]) => void;
  onVerified: (order: ServerOrder | null) => void;
  onFailed: (reason: string, unconfirmed?: boolean) => void;
  onDemoPreview: () => void;
  // Clears the conversation and dispatches RESET (same as the header button).
  onNewChat: () => void;
  // Opens the profile's orders tab (signed in only).
  onViewOrders?: () => void;
  mood: Mood;
  dark: boolean;
};

const NOT_COMPLETED =
  "PhonePe reported the payment as not completed. If money was debited, it is refunded by your bank.";

const NOT_CONFIRMED =
  "We didn't hear back from PhonePe in 15 minutes. If money was debited, the order is confirmed automatically or refunded. Check the status before paying again.";

// Buttons on the status screen that show a loader while their action starts.
type ActionKind = "retry" | "switch" | "check" | "reopen";

const str = (v: unknown) => (v == null ? "" : String(v));

const spinner = (
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
);

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
  onRetryWith,
  onRecheck,
  rechecking,
  onPaymentCheck,
  onVerified,
  onFailed,
  onDemoPreview,
  onNewChat,
  onViewOrders,
  mood,
  dark,
}: Props) {
  const pending = flow.state === "payment_pending";
  const checkNowRef = useRef<() => void>(() => {});
  const cbRef = useRef({ onVerified, onFailed, onPaymentCheck });
  useEffect(() => {
    cbRef.current = { onVerified, onFailed, onPaymentCheck };
  }, [onVerified, onFailed, onPaymentCheck]);

  // The PhonePe window, including one reopened from this screen. Known from
  // the click (null when the browser blocked it), before PhonePe's page loads.
  const popupRef = useRef<Window | null>(payment.popup);
  useEffect(() => {
    popupRef.current = payment.popup;
  }, [payment.popup]);
  // "open" | "closed" | "none" (blocked): watched every second while paying.
  const [win, setWin] = useState<"open" | "closed" | "none">("open");
  // PhonePe's return page told this tab the customer is back.
  const [returned, setReturned] = useState(false);
  const popupClosed = win === "closed" || returned;
  const blocked = win === "none" && !returned;

  // ---------- opening: PhonePe's page isn't ready yet ----------
  // Closing the window here, or a slow start, must never leave the screen stuck.
  const opening =
    pending && payment.live && payment.method !== "cod" && !payment.url;
  const [openingClosed, setOpeningClosed] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!opening) return;
    const t0 = Date.now();
    const watch = setInterval(() => {
      if (popupRef.current?.closed) setOpeningClosed(true);
      if (Date.now() - t0 > 12000) setSlow(true);
    }, 600);
    return () => {
      clearInterval(watch);
      setOpeningClosed(false);
      setSlow(false);
    };
  }, [opening, payment.key]);

  // ---------- paying: poll GET /payments/:id until paid / failed ----------
  // (the PhonePe webhook updates it on the server).
  useEffect(() => {
    if (!pending || !payment.live || !payment.attemptId || !payment.url) return;
    const w = waitForCheckoutPayment(payment.attemptId, token, {
      onCheck: (r) => cbRef.current.onPaymentCheck(r.status),
    });
    checkNowRef.current = w.checkNow;
    let active = true;
    w.done.then((r) => {
      if (!active) return;
      if (r.status === "paid") cbRef.current.onVerified(r.order);
      else if (r.status === "failed") cbRef.current.onFailed(NOT_COMPLETED);
      else cbRef.current.onFailed(NOT_CONFIRMED, true);
    });

    // PhonePe sends its window back to the storefront's /order/{txn} page, which
    // tells this tab. That only triggers a check: the server stays the source of truth.
    const trusted = new Set([window.location.origin, siteOrigin()]);
    const onMessage = (e: MessageEvent) => {
      if (!trusted.has(e.origin)) return;
      const d = e.data as { type?: string } | null;
      if (d?.type !== PAYMENT_RETURN_MESSAGE) return;
      setReturned(true);
      w.checkNow();
    };
    window.addEventListener("message", onMessage);

    // Window state: a newly closed window triggers a check right away.
    let last: "open" | "closed" | "none" | null = null;
    const look = () => {
      const cur = popupRef.current;
      const now = !cur ? "none" : cur.closed ? "closed" : "open";
      if (now === last) return;
      if (now === "closed" && last === "open") w.checkNow();
      last = now;
      setWin(now);
    };
    look();
    const watch = setInterval(look, 1000);

    return () => {
      active = false;
      w.cancel();
      clearInterval(watch);
      window.removeEventListener("message", onMessage);
      setWin("open");
      setReturned(false);
    };
  }, [pending, payment.live, payment.attemptId, payment.url, token]);

  const reopen = () => {
    if (!payment.url) return;
    const w = window.open(
      payment.url,
      "aquakart-phonepe",
      "width=480,height=760",
    );
    if (!w) return;
    popupRef.current = w;
    setWin("open");
    setReturned(false);
  };

  // Stops waiting: closes PhonePe's window and shows the failed screen, where
  // the status can still be checked once the order exists.
  const cancelPayment = (reason: string) => {
    try {
      popupRef.current?.close();
    } catch {
      // another origin's window: leave it
    }
    onFailed(reason);
  };

  // ---------- button actions: loaders in place, no layout jumps ----------
  // A click keeps the screen as it was (a snapshot of the payment) with a
  // loader in the pressed button and the other buttons disabled, until the
  // new attempt shows something real: PhonePe opened, the COD order placed,
  // a new failure, or a fresh status answer.
  const [action, setAction] = useState<{
    kind: ActionKind;
    snap: PaymentInfo;
  } | null>(null);
  const start = (kind: ActionKind, run: () => void) => {
    setAction({ kind, snap: payment });
    run();
  };
  useEffect(() => {
    if (!action) return;
    const { kind, snap } = action;
    const clear = () => setAction(null);
    if (flow.state === "confirmed") return clear();
    if (kind === "check" || kind === "reopen") {
      if (kind === "check" && payment.checkedAt !== snap.checkedAt)
        return clear();
      const t = setTimeout(clear, kind === "check" ? 6000 : 900);
      return () => clearTimeout(t);
    }
    // retry / switch (a demo payment never gets a new key)
    if (!payment.live && flow.state === "payment_pending") return clear();
    if (payment.key !== snap.key) {
      if (flow.state === "payment_failed") return clear();
      if (payment.method === "online" && (payment.url || payment.reason))
        return clear();
      return;
    }
    // Nothing started (e.g. the price was still loading): don't spin forever.
    const t = setTimeout(clear, 1500);
    return () => clearTimeout(t);
  }, [action, flow.state, payment]);

  const items = draft?.items || [];
  const so = payment.serverOrder;
  const total =
    so?.totalAmount ??
    (quoteState.status === "ready" && !quoteState.demo
      ? quoteState.data.payableAmount
      : null);

  // Cash on delivery: no gateway window to wait for, and nothing paid yet.
  const cod = payment.method === "cod";

  // ---------- confirmed ----------
  if (flow.state === "confirmed" && cod && payment.live)
    return (
      <CodConfirmation
        order={so}
        draft={draft}
        quote={
          quoteState.status === "ready" && !quoteState.demo
            ? quoteState.data
            : null
        }
        mood={mood}
        dark={dark}
        onContinue={() => dispatch({ type: "CLOSE" })}
        onViewProduct={
          flow.productId
            ? () => dispatch({ type: "VIEW", productId: flow.productId })
            : undefined
        }
        onViewOrders={onViewOrders}
        onNewChat={onNewChat}
      />
    );
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
              : cod
                ? "Order placed"
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
              : cod
                ? "Aquakart has your order. Pay when it's delivered; we'll call to confirm the installation slot."
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
                <dt style={{ color: "var(--aq-mut)" }}>
                  {cod ? "Pay on delivery" : "Paid"}
                </dt>
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
                  {installationLabel({ day: inst.day, slot: inst.slot || "" })}
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
  // While a retry / switch starts, keep drawing the screen it was clicked on.
  const holding =
    !!action && (action.kind === "retry" || action.kind === "switch");
  const vp = holding ? action.snap : payment;
  const vCod = vp.method === "cod";
  const failed = holding || flow.state === "payment_failed";
  const unconfirmed = failed && vp.unconfirmed;
  const busy = !!action || rechecking;
  const amount = total != null ? Number(total) : null;
  const price = amount != null ? ` ${INR(amount)}` : "";
  const orderNumber = vCod ? undefined : vp.orderNumber || null;
  // Status chip: what the server last said, read against where the customer is.
  const chip: { text: string; tone: Tone } = holding
    ? {
        text:
          action.kind === "retry"
            ? vCod
              ? "Placing order again"
              : "Starting a new payment"
            : vCod
              ? "Switching to PhonePe"
              : "Switching to cash on delivery",
        tone: "wait",
      }
    : vCod
      ? failed
        ? { text: "Order not placed", tone: "bad" }
        : { text: "Placing order", tone: "wait" }
      : vp.serverStatus === "paid"
        ? { text: "Paid", tone: "ok" }
        : vp.serverStatus === "failed" || (failed && !unconfirmed)
          ? { text: "Failed", tone: "bad" }
          : unconfirmed || popupClosed
            ? { text: "Pending confirmation", tone: "warn" }
            : vp.url
              ? blocked
                ? { text: "Not opened yet", tone: "warn" }
                : { text: "Awaiting payment", tone: "wait" }
              : openingClosed
                ? { text: "Window closed", tone: "warn" }
                : { text: "Starting", tone: "wait" };
  const canRecheck = !vCod && !!vp.attemptId;
  // The refresh beside the status: a poll while waiting, a one-off re-check after.
  const pollNow = () => start("check", () => checkNowRef.current());
  const checkNow =
    !canRecheck || busy
      ? undefined
      : pending && !holding
        ? vp.url
          ? pollNow
          : undefined
        : onRecheck;

  // Where the payment got to, step by step.
  const steps: Step[] = vCod
    ? [
        { label: "Details checked", state: "done" },
        {
          label: "Placing order",
          state: holding ? "active" : failed ? "failed" : "active",
        },
        { label: "Confirmed", state: "todo" },
      ]
    : [
        {
          label: "Order created",
          state: vp.orderId ? "done" : failed && !holding ? "failed" : "active",
        },
        {
          label: "PhonePe opened",
          state: vp.url
            ? blocked && !failed
              ? "warn"
              : "done"
            : failed && !holding && vp.orderId
              ? "failed"
              : "todo",
        },
        {
          label: "Payment",
          state: holding
            ? "active"
            : !vp.url
              ? "todo"
              : unconfirmed || (pending && popupClosed)
                ? "warn"
                : failed
                  ? "failed"
                  : "active",
        },
        { label: "Confirmed", state: "todo" },
      ];

  const slot =
    draft?.slotDay && draft.slotTime
      ? installationLabel({ day: draft.slotDay, slot: draft.slotTime })
      : "";
  const orderCard = vp.live && (
    <OrderStatusCard
      orderNumber={orderNumber}
      amount={amount}
      method={vp.method}
      status={chip.text}
      tone={chip.tone}
      checkedAt={vp.checkedAt}
      checking={rechecking || action?.kind === "check" || holding}
      onCheck={checkNow}
      items={items}
      address={addressLine(draft?.address)}
      slot={slot}
    />
  );
  const row = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
    justifyContent: "center",
  };
  const loading = (kind: ActionKind) => action?.kind === kind;
  const title = failed
    ? unconfirmed
      ? "Payment not confirmed yet"
      : vCod
        ? "Order not placed"
        : "Payment not completed"
    : vCod
      ? "Placing your order…"
      : !vp.url
        ? openingClosed
          ? "You closed the PhonePe window"
          : "Opening PhonePe…"
        : blocked
          ? "Open PhonePe to pay"
          : popupClosed
            ? "Did you finish paying?"
            : "Waiting for your payment…";
  const text = failed
    ? vp.reason ||
      (unconfirmed
        ? NOT_CONFIRMED
        : vCod
          ? "Couldn't place the order. Try again."
          : NOT_COMPLETED)
    : vCod
      ? "Confirming it with Aquakart. Nothing is charged now: you pay when it's delivered."
      : !vp.url
        ? openingClosed
          ? "PhonePe was still opening, so nothing has been charged. Cancel this payment, or keep waiting and pay when it opens."
          : slow
            ? "PhonePe is taking longer than usual. Nothing has been charged yet: keep waiting, or cancel and try again."
            : "Creating your order and opening PhonePe's secure window. Nothing is charged until you approve it in PhonePe."
        : blocked
          ? "Your browser blocked the PhonePe window. Open it to pay: this page updates once Aquakart's server confirms the payment."
          : popupClosed
            ? "PhonePe hasn't confirmed this payment yet. If you paid, it confirms here on its own, usually within a few minutes, so don't pay again. If you cancelled in PhonePe, say so below."
            : "Finish the payment in the PhonePe window. This page updates once Aquakart's server confirms it. Keep this tab open.";

  // Demo (no gateway): the preview while "paying"; a demo failure uses the screen below.
  if (!vp.live && !failed) return preview();

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
        className="aq-paystatus"
        data-state={failed ? (unconfirmed ? "warn" : "failed") : "pending"}
        aria-busy={busy}
      >
        <div style={{ height: 132, display: "grid", placeItems: "center" }}>
          <AquaDroplet mood={mood} size={104} dark={dark} />
        </div>

        {vp.live && <PaymentTimeline steps={steps} />}

        <div className="aq-paystatus-head">
          {!failed && spinner}
          <h2
            className="aq-display aq-paystatus-title"
            role={failed ? undefined : "status"}
          >
            {title}
          </h2>
        </div>
        <p className="aq-paystatus-text" role={failed ? "alert" : undefined}>
          {text}
        </p>

        {orderCard}

        {/* The same two-button grid on every screen, so switching never reflows. */}
        <div className="aq-payactions">
          {failed && unconfirmed ? (
            <>
              <LoadingButton
                className="aq-btn aq-btn-primary aq-payaction"
                loading={rechecking}
                disabled={busy || !canRecheck}
                onClick={onRecheck}
                label="Check status again"
                sub="Asks Aquakart's server"
                loadingLabel="Checking…"
              />
              <LoadingButton
                className="aq-btn aq-btn-glass aq-payaction"
                loading={loading("retry")}
                disabled={busy}
                onClick={() => start("retry", onRetry)}
                label={`Retry${price}`}
                sub="Only if no money left your account"
                loadingLabel="Opening PhonePe…"
                loadingSub="Keep this tab open"
              />
            </>
          ) : failed ? (
            <>
              <LoadingButton
                className="aq-btn aq-btn-primary aq-payaction"
                loading={loading("retry")}
                disabled={busy}
                onClick={() => start("retry", onRetry)}
                label={vCod ? "Try again" : `Retry${price} with PhonePe`}
                sub={vCod ? "Place the same order" : "UPI, cards, net banking"}
                loadingLabel={vCod ? "Placing your order…" : "Opening PhonePe…"}
                loadingSub={vCod ? "Nothing to pay now" : "Keep this tab open"}
              />
              <LoadingButton
                className="aq-btn aq-btn-glass aq-payaction"
                loading={loading("switch")}
                disabled={busy}
                onClick={() =>
                  start("switch", () => onRetryWith(vCod ? "online" : "cod"))
                }
                label={
                  vCod
                    ? `Pay${price} online instead`
                    : `Pay${price} on delivery instead`
                }
                sub={vCod ? "Secure PhonePe checkout" : "Nothing to pay now"}
                loadingLabel={vCod ? "Opening PhonePe…" : "Placing your order…"}
                loadingSub={vCod ? "Keep this tab open" : "Nothing to pay now"}
              />
            </>
          ) : vCod ? (
            <LoadingButton
              className="aq-btn aq-btn-glass aq-payaction aq-payaction-wide"
              loading
              onClick={() => {}}
              label="Placing your order"
              loadingLabel="Placing your order…"
              loadingSub="This takes a few seconds"
            />
          ) : !vp.url ? (
            openingClosed ? (
              <>
                <button
                  type="button"
                  className="aq-btn aq-btn-primary aq-payaction"
                  onClick={() =>
                    cancelPayment(
                      "You cancelled before PhonePe opened. Nothing was charged.",
                    )
                  }
                >
                  <span>Cancel payment</span>
                  <small>Nothing was charged</small>
                </button>
                <button
                  type="button"
                  className="aq-btn aq-btn-glass aq-payaction"
                  onClick={() => setOpeningClosed(false)}
                >
                  <span>Keep waiting</span>
                  <small>Pay when PhonePe opens</small>
                </button>
              </>
            ) : (
              <LoadingButton
                className="aq-btn aq-btn-glass aq-payaction aq-payaction-wide"
                loading
                onClick={() => {}}
                label="Opening PhonePe"
                loadingLabel="Opening PhonePe…"
                loadingSub={
                  slow ? "Still working on it" : "Usually a few seconds"
                }
              />
            )
          ) : blocked ? (
            <>
              <LoadingButton
                className="aq-btn aq-btn-primary aq-payaction"
                loading={loading("reopen")}
                disabled={busy}
                onClick={() => start("reopen", reopen)}
                label="Open PhonePe"
                sub="UPI, cards, net banking"
                loadingLabel="Opening…"
              />
              <LoadingButton
                className="aq-btn aq-btn-glass aq-payaction"
                loading={loading("check")}
                disabled={busy}
                onClick={pollNow}
                label="Check status"
                sub="Asks Aquakart's server"
                loadingLabel="Checking…"
              />
            </>
          ) : popupClosed ? (
            <>
              <LoadingButton
                className="aq-btn aq-btn-primary aq-payaction"
                loading={loading("check")}
                disabled={busy}
                onClick={pollNow}
                label="I paid · check status"
                sub="Asks Aquakart's server"
                loadingLabel="Checking…"
              />
              <button
                type="button"
                className="aq-btn aq-btn-glass aq-payaction"
                disabled={busy}
                onClick={() =>
                  cancelPayment(
                    "You cancelled or didn't finish paying in PhonePe. If money was debited anyway, it is confirmed here automatically or refunded by your bank.",
                  )
                }
              >
                <span>I cancelled / didn&apos;t pay</span>
                <small>Retry or pay on delivery next</small>
              </button>
            </>
          ) : (
            <>
              <LoadingButton
                className="aq-btn aq-btn-primary aq-payaction"
                loading={loading("check")}
                disabled={busy}
                onClick={pollNow}
                label="Check status"
                sub="Asks Aquakart's server"
                loadingLabel="Checking…"
              />
              <LoadingButton
                className="aq-btn aq-btn-glass aq-payaction"
                loading={loading("reopen")}
                disabled={busy}
                onClick={() => start("reopen", reopen)}
                label="Reopen payment window"
                sub="If you closed PhonePe"
                loadingLabel="Opening…"
              />
            </>
          )}
        </div>

        {/* Secondary row: always present, so the space below never collapses. */}
        <div style={row} className="aq-paystatus-more">
          {failed ? (
            <>
              {canRecheck && !unconfirmed && (
                <LoadingButton
                  className="aq-btn aq-btn-ghost"
                  loading={rechecking}
                  disabled={busy}
                  onClick={onRecheck}
                  label="Check status again"
                  loadingLabel="Checking…"
                />
              )}
              <button
                type="button"
                className="aq-btn aq-btn-ghost"
                disabled={busy}
                onClick={() => dispatch({ type: "EDIT" })}
              >
                Edit details
              </button>
              <button
                type="button"
                className="aq-btn aq-btn-ghost"
                disabled={busy}
                onClick={() => dispatch({ type: "CLOSE" })}
              >
                Close
              </button>
            </>
          ) : !vCod && vp.url && popupClosed && !blocked ? (
            <LoadingButton
              className="aq-btn aq-btn-ghost"
              loading={loading("reopen")}
              disabled={busy}
              onClick={() => start("reopen", reopen)}
              label="Reopen payment window"
              loadingLabel="Opening…"
            />
          ) : !vCod && !openingClosed ? (
            <button
              type="button"
              className="aq-btn aq-btn-ghost"
              disabled={busy}
              onClick={() =>
                cancelPayment(
                  vp.url
                    ? "You cancelled the payment. If money was debited anyway, it is confirmed here automatically or refunded by your bank."
                    : "You cancelled before PhonePe opened. Nothing was charged.",
                )
              }
            >
              Cancel payment
            </button>
          ) : (
            <span className="aq-paystatus-note">
              {vCod
                ? "We'll call to confirm the installation slot."
                : "Card and UPI details stay in PhonePe's window."}
            </span>
          )}
        </div>

        {failed && unconfirmed && (
          <span className="aq-paystatus-note">
            Retry only if no money left your account. A retry is a new payment.
          </span>
        )}
        {failed && !vCod && (
          <PaymentHelp
            unconfirmed={unconfirmed}
            orderNumber={orderNumber ?? null}
            amount={amount}
          />
        )}
      </div>
    </div>
  );

  // ---------- demo (no gateway connected) ----------
  function preview() {
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
        <div className="aq-paystatus">
          <div style={{ height: 132, display: "grid", placeItems: "center" }}>
            <AquaDroplet mood={mood} size={104} dark={dark} />
          </div>
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
        </div>
      </div>
    );
  }
}
