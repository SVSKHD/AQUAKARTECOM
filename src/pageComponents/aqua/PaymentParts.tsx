"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  AlertTriangle,
  Check,
  Copy,
  MessageCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { INR } from "./catalogue";
import { aquaConfig } from "./config";
import type { CheckoutItem, PayMethod } from "./types";

// Pieces of the payment status screen: the progress timeline, the order card
// (what's being paid for, with the server's payment status) and the help
// shown when a payment fails.

export type Tone = "wait" | "ok" | "bad" | "warn";
export const TONES: Record<Tone, { bg: string; fg: string }> = {
  wait: { bg: "var(--aq-tint)", fg: "var(--aq-ink)" },
  ok: { bg: "var(--aq-mint)", fg: "var(--aq-mintink)" },
  bad: { bg: "#FDECEC", fg: "#8A1F1F" },
  warn: { bg: "#FEF3C7", fg: "#8A5A00" },
};

// ---------- timeline ----------

export type StepState = "done" | "active" | "failed" | "warn" | "todo";
export type Step = { label: string; state: StepState };

const STEP_TEXT: Record<StepState, string> = {
  done: "done",
  active: "in progress",
  failed: "failed",
  warn: "waiting for confirmation",
  todo: "not started",
};

export function PaymentTimeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="aq-paytl" aria-label="Payment progress">
      {steps.map((s, i) => (
        <li
          key={s.label}
          className="aq-paytl-step"
          data-state={s.state}
          aria-current={
            s.state === "active" || s.state === "warn" ? "step" : undefined
          }
        >
          <span className="aq-paytl-dot" aria-hidden="true">
            {s.state === "done" ? (
              <Check size={13} strokeWidth={3} />
            ) : s.state === "failed" ? (
              <X size={13} strokeWidth={3} />
            ) : s.state === "warn" ? (
              <AlertTriangle size={12} strokeWidth={2.5} />
            ) : (
              <span className="aq-paytl-num">{i + 1}</span>
            )}
          </span>
          <span className="aq-paytl-label">
            {s.label}
            <span className="aq-sr-only">: {STEP_TEXT[s.state]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// ---------- order card ----------

// "just now", "40s ago", "3 min ago": refreshed every 10s while shown.
function useAgo(at: number | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!at) return;
    const t = setInterval(() => tick((n) => n + 1), 10000);
    return () => clearInterval(t);
  }, [at]);
  if (!at) return "";
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : dayjs(at).format("h:mm a");
}

export function OrderStatusCard({
  orderNumber,
  amount,
  method,
  status,
  tone,
  checkedAt,
  checking,
  onCheck,
  items,
  address,
  slot,
}: {
  // undefined: no order row (cash on delivery); null: still being created.
  orderNumber: string | null | undefined;
  amount: number | null;
  method: PayMethod;
  status: string;
  tone: Tone;
  checkedAt: number | null;
  checking?: boolean;
  // Ask the server again (shown as a refresh button by the status).
  onCheck?: () => void;
  items: CheckoutItem[];
  address: string;
  slot: string;
}) {
  const ago = useAgo(checkedAt);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!orderNumber) return;
    void navigator.clipboard
      ?.writeText(orderNumber)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  };
  const copyable = !!orderNumber && /\d/.test(orderNumber);

  return (
    <div className="aq-card aq-paycard">
      <dl className="aq-paycard-grid">
        {orderNumber !== undefined && (
          <>
            <dt>Order</dt>
            <dd className="aq-paycard-order">
              {orderNumber ? (
                <span className="aq-mono">{orderNumber}</span>
              ) : (
                // Same height as the number, so nothing shifts when it lands.
                <span className="aq-paycard-skel" aria-label="Creating order" />
              )}
              {copyable && (
                <button
                  type="button"
                  className="aq-paycard-icon"
                  onClick={copy}
                  aria-label={
                    copied ? "Order number copied" : "Copy order number"
                  }
                  title={copied ? "Copied" : "Copy"}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </dd>
          </>
        )}
        {amount != null && (
          <>
            <dt>Amount</dt>
            <dd className="aq-paycard-amount">{INR(amount)}</dd>
          </>
        )}
        <dt>Method</dt>
        <dd>
          {method === "cod" ? "Cash on delivery" : "PhonePe (UPI, cards)"}
        </dd>
        <dt>Payment</dt>
        <dd>
          <span className="aq-paycard-status">
            <span
              role="status"
              className="aq-paycard-chip"
              data-tone={tone}
              style={{ background: TONES[tone].bg, color: TONES[tone].fg }}
            >
              {status}
            </span>
            {onCheck && (
              <button
                type="button"
                className="aq-paycard-icon"
                onClick={onCheck}
                disabled={checking}
                aria-label="Check the payment status now"
                title="Check now"
              >
                <RefreshCw
                  size={14}
                  className={checking ? "aq-spin" : undefined}
                />
              </button>
            )}
          </span>
          {(checking || ago) && (
            <span className="aq-paycard-ago">
              {checking ? "Checking with Aquakart…" : `Checked ${ago}`}
            </span>
          )}
        </dd>
      </dl>

      {(items.length > 0 || address || slot) && (
        <div className="aq-paycard-more">
          {items.length > 0 && (
            <ul className="aq-paycard-items" aria-label="Items">
              {items.map((i) => (
                <li key={`${i.id}-${i.variant}`}>
                  <span
                    aria-hidden="true"
                    className="aq-paycard-thumb"
                    style={
                      i.photo
                        ? {
                            background: `var(--aq-surf) center / contain no-repeat url("${i.photo}")`,
                          }
                        : undefined
                    }
                  />
                  <span className="aq-paycard-item">
                    {i.title}
                    {i.variantLabel ? ` · ${i.variantLabel}` : ""}
                  </span>
                  <span className="aq-paycard-qty">× {i.qty}</span>
                </li>
              ))}
            </ul>
          )}
          {address && (
            <p className="aq-paycard-line">
              <span>Deliver to</span> {address}
            </p>
          )}
          {slot && (
            <p className="aq-paycard-line">
              <span>Installation</span> {slot}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- help when a payment fails ----------

export const supportLink = (text: string) =>
  `https://wa.me/${aquaConfig.expertWhatsApp}?text=${encodeURIComponent(text)}`;

export function PaymentHelp({
  unconfirmed,
  orderNumber,
  amount,
}: {
  // Stopped waiting (money may have left the account) vs a reported failure.
  unconfirmed: boolean;
  orderNumber: string | null;
  amount: number | null;
}) {
  const ref = orderNumber && /\d/.test(orderNumber) ? ` ${orderNumber}` : "";
  const sum = amount != null ? ` (${INR(amount)})` : "";
  const text = unconfirmed
    ? `Hi Aquakart, my payment for order${ref}${sum} hasn't been confirmed yet. Can you check it?`
    : `Hi Aquakart, my payment for order${ref}${sum} didn't go through. Can you help?`;
  return (
    <div className="aq-payhelp">
      {unconfirmed ? (
        <p className="aq-payhelp-lead">
          Money left your account but no confirmation yet? Don&apos;t pay again.
          Send us the order number and we&apos;ll check it with PhonePe.
        </p>
      ) : (
        <>
          <p className="aq-payhelp-lead">Usually one of these:</p>
          <ul className="aq-payhelp-list">
            <li>UPI daily limit reached, or a wrong UPI PIN</li>
            <li>The bank was busy: try again in a minute</li>
            <li>A different UPI app, card or net banking often works</li>
          </ul>
        </>
      )}
      <a
        className="aq-payhelp-wa"
        href={supportLink(text)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={15} aria-hidden="true" /> Get help on WhatsApp
      </a>
    </div>
  );
}

// ---------- buttons with an in-place loader ----------

// Both faces share one grid cell, so the button keeps the size of the larger
// face: switching to the loader never resizes it or moves its neighbours.
export function LoadingButton({
  className,
  loading,
  disabled,
  onClick,
  label,
  sub,
  loadingLabel,
  loadingSub,
}: {
  className: string;
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  loadingLabel: string;
  loadingSub?: string;
}) {
  return (
    <button
      type="button"
      className={`${className} aq-loadbtn`}
      data-loading={loading}
      aria-busy={loading}
      disabled={disabled || loading}
      onClick={onClick}
    >
      <span className="aq-loadbtn-face" aria-hidden={loading}>
        <span className="aq-loadbtn-label">{label}</span>
        {sub && <small>{sub}</small>}
      </span>
      <span className="aq-loadbtn-face aq-loadbtn-busy" aria-hidden={!loading}>
        <span className="aq-loadbtn-label">
          <span className="aq-loadbtn-spin" aria-hidden="true" />
          {loadingLabel}
        </span>
        {(loadingSub || sub) && <small>{loadingSub || sub}</small>}
      </span>
      {loading && (
        <span className="aq-sr-only" role="status">
          {loadingLabel}
        </span>
      )}
    </button>
  );
}
