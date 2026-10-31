"use client";

import { useState } from "react";
import dayjs from "dayjs";
import {
  Banknote,
  Check,
  Copy,
  MapPin,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  Receipt,
  Truck,
  Wrench,
} from "lucide-react";
import type { Quote, ServerOrder } from "@/utils/aquaCommerce";
import AquaDroplet from "./AquaDroplet";
import { INR } from "./catalogue";
import { installationLabel } from "./orders";
import { supportLink } from "./PaymentParts";
import type { CheckoutDraft, Mood } from "./types";

// The "order placed" screen for cash on delivery: what was ordered, what to
// pay at the door, and what happens between now and installation.

const str = (v: unknown) => (v == null ? "" : String(v));
const num = (...vs: unknown[]) => {
  for (const v of vs) {
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

export type CodLine = {
  key: string;
  title: string;
  variant: string;
  qty: number;
  price: number;
  photo: string;
};

export type CodSummary = {
  orderId: string;
  placedAt: string | null;
  lines: CodLine[];
  subtotal: number;
  discount: number;
  delivery: number | null;
  tax: number;
  total: number;
  coupon: string;
  eta: string | null;
  installation: { day: string; slot: string } | null;
  name: string;
  phone: string;
  address: string;
};

// Server order first (it's what was saved), then the quote and the draft.
export function codSummary(
  so: ServerOrder | null,
  draft: CheckoutDraft | null,
  quote: Quote | null,
): CodSummary {
  const draftItems = draft?.items || [];
  const serverItems = Array.isArray(so?.items)
    ? (so!.items as Record<string, unknown>[])
    : [];
  // The draft has photos and variant labels; the server only names and prices.
  const lines: CodLine[] = draftItems.length
    ? draftItems.map((i) => ({
        key: `${i.id}-${i.variant}`,
        title: i.title,
        variant: i.variantLabel || "",
        qty: i.qty,
        price: i.price,
        photo: i.photo || "",
      }))
    : serverItems.map((i, n) => ({
        key: str(i.productId) || String(n),
        title: str(i.name || i.title) || "Item",
        variant: "",
        qty: num(i.quantity) ?? 1,
        price: num(i.price) ?? 0,
        photo: "",
      }));
  const itemsSum = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const subtotal = num(quote?.subtotal) ?? itemsSum;
  const discount = num(so?.discounts, quote?.discount) ?? 0;
  const delivery = num(so?.shippingCost, quote?.deliveryCharge);
  const tax = num(so?.taxes, quote?.tax) ?? 0;
  const total =
    num(so?.totalAmount, quote?.payableAmount) ??
    subtotal - discount + (delivery || 0) + tax;
  const inst = so?.installation as { day?: string; slot?: string } | undefined;
  const day = inst?.day || draft?.slotDay || "";
  const slot = inst?.slot || draft?.slotTime || "";
  const a = (so?.shippingAddress || draft?.address || {}) as Record<
    string,
    unknown
  >;
  return {
    orderId: str(so?.orderId || so?.transactionId),
    placedAt: so?.createdAt ? str(so.createdAt) : null,
    lines,
    subtotal,
    discount,
    delivery,
    tax,
    total,
    coupon: str(
      so?.offerAppliedDetails?.code ||
        quote?.coupon?.code ||
        quote?.couponCode ||
        draft?.coupon,
    ).toUpperCase(),
    eta: so?.estimatedDelivery ? str(so.estimatedDelivery) : null,
    installation: day ? { day, slot } : null,
    name: draft?.name || str(a.name),
    phone: draft?.phone || str(a.phone),
    address: [a.street, a.city, a.state, a.postalCode]
      .map(str)
      .filter(Boolean)
      .join(", "),
  };
}

const fmtDay = (d: string | null) =>
  d && dayjs(d).isValid() ? dayjs(d).format("ddd D MMM") : "";

type Props = {
  order: ServerOrder | null;
  draft: CheckoutDraft | null;
  quote: Quote | null;
  mood: Mood;
  dark: boolean;
  onContinue: () => void;
  onViewProduct?: () => void;
  onViewOrders?: () => void;
  onNewChat: () => void;
};

export default function CodConfirmation(p: Props) {
  const s = codSummary(p.order, p.draft, p.quote);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!s.orderId) return;
    void navigator.clipboard
      ?.writeText(s.orderId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  };

  const placed = s.placedAt ? dayjs(s.placedAt) : null;
  const eta = fmtDay(s.eta);
  const install = s.installation ? installationLabel(s.installation) : "";
  const count = s.lines.reduce((n, l) => n + l.qty, 0);
  const help = supportLink(
    `Hi Aquakart, about my cash on delivery order${s.orderId ? ` ${s.orderId}` : ""} (${INR(s.total)}).`,
  );

  const steps = [
    {
      icon: PackageCheck,
      label: "Order placed",
      note:
        placed && placed.isValid()
          ? placed.format("D MMM, h:mm a")
          : "Just now",
      state: "done",
    },
    {
      icon: PhoneCall,
      label: "Confirmation call",
      note: s.phone ? `We'll call ${s.phone}` : "We'll call you shortly",
      state: "active",
    },
    {
      icon: Truck,
      label: "Delivery · pay at the door",
      note: `${eta ? `By ${eta}` : "Within 7 days"} · ${INR(s.total)}`,
      state: "todo",
    },
    {
      icon: Wrench,
      label: "Installation",
      note: install || "Slot confirmed on the call",
      state: "todo",
    },
  ] as const;

  return (
    // One screen: the order and amount, the journey, then where it goes and
    // the bill side by side. Phones stack it.
    <div className="aq-noscroll aq-cod-page">
      <div className="aq-cod">
        <header className="aq-cod-hero">
          <div className="aq-cod-drop">
            <AquaDroplet mood={p.mood} size={64} dark={p.dark} />
          </div>
          <div className="aq-cod-hero-text">
            <span className="aq-cod-chip">
              <Banknote size={14} aria-hidden="true" /> Cash on delivery
            </span>
            <h2 className="aq-display aq-cod-title">Order placed</h2>
            <p className="aq-cod-lead">
              Nothing to pay now. We&apos;ll call to confirm delivery and
              installation.
            </p>
          </div>
        </header>

        {/* What to have ready at the door. */}
        <section className="aq-cod-due" aria-label="Pay on delivery">
          <span className="aq-cod-due-k">Pay on delivery</span>
          <strong className="aq-cod-due-v">{INR(s.total)}</strong>
          <p className="aq-cod-due-note">
            Cash or UPI at the door{eta ? ` · by ${eta}` : ""}
          </p>
          {s.orderId && (
            <button
              type="button"
              className="aq-cod-id"
              onClick={copy}
              aria-label={`Order ${s.orderId}, copy`}
            >
              <span className="aq-mono">{s.orderId}</span>
              {copied ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                <Copy size={13} aria-hidden="true" />
              )}
              <span className="aq-cod-copied" aria-live="polite">
                {copied ? "Copied" : ""}
              </span>
            </button>
          )}
        </section>

        <section
          className="aq-cod-card aq-cod-next"
          aria-labelledby="aq-cod-next"
        >
          <h3 id="aq-cod-next" className="aq-cod-h">
            What happens next
          </h3>
          <ol className="aq-cod-steps">
            {steps.map(({ icon: Icon, label, note, state }) => (
              <li
                key={label}
                className="aq-cod-step"
                data-state={state}
                aria-current={state === "active" ? "step" : undefined}
              >
                <span className="aq-cod-step-dot" aria-hidden="true">
                  {state === "done" ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <Icon size={14} />
                  )}
                </span>
                <span className="aq-cod-step-text">
                  <span className="aq-cod-step-label">{label}</span>
                  <span className="aq-cod-step-note">{note}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="aq-cod-card aq-cod-where"
          aria-labelledby="aq-cod-where"
        >
          <h3 id="aq-cod-where" className="aq-cod-h">
            <MapPin size={14} aria-hidden="true" /> Delivery & installation
          </h3>
          <dl className="aq-cod-facts">
            {(s.name || s.phone) && (
              <>
                <dt>Contact</dt>
                <dd>{[s.name, s.phone].filter(Boolean).join(" · ")}</dd>
              </>
            )}
            {s.address && (
              <>
                <dt>Address</dt>
                <dd>{s.address}</dd>
              </>
            )}
            <dt>Delivery</dt>
            <dd>{eta ? `By ${eta}` : "Within 7 days"}</dd>
            <dt>Installation</dt>
            <dd>{install || "We'll fix a slot on the call"}</dd>
          </dl>
          <ul className="aq-cod-tips" aria-label="Good to know">
            <li>Check the package is sealed before you pay.</li>
            <li>
              Need to change the slot or address? Message us before it ships.
            </li>
          </ul>
        </section>

        <section
          className="aq-cod-card aq-cod-bill-card"
          aria-labelledby="aq-cod-items"
        >
          <h3 id="aq-cod-items" className="aq-cod-h">
            <Receipt size={14} aria-hidden="true" />
            {count} {count === 1 ? "item" : "items"}
          </h3>
          <ul className="aq-cod-lines">
            {s.lines.map((l) => (
              <li key={l.key} className="aq-cod-line">
                <span className="aq-cod-thumb" aria-hidden="true">
                  {l.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photo} alt="" loading="lazy" />
                  ) : (
                    <PackageCheck size={18} />
                  )}
                </span>
                <span className="aq-cod-line-main">
                  <span className="aq-cod-line-title">{l.title}</span>
                  <span className="aq-cod-line-sub">
                    {[l.variant, `${l.qty} × ${INR(l.price)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="aq-cod-line-sum">{INR(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="aq-cod-bill">
            <dt>Subtotal</dt>
            <dd>{INR(s.subtotal)}</dd>
            {s.discount > 0 && (
              <>
                <dt>Discount{s.coupon ? ` (${s.coupon})` : ""}</dt>
                <dd className="aq-cod-save">−{INR(s.discount)}</dd>
              </>
            )}
            {s.delivery != null && (
              <>
                <dt>Delivery</dt>
                <dd>{s.delivery > 0 ? INR(s.delivery) : "Free"}</dd>
              </>
            )}
            {s.tax > 0 && (
              <>
                <dt>Tax</dt>
                <dd>{INR(s.tax)}</dd>
              </>
            )}
            <dt className="aq-cod-bill-total">To pay on delivery</dt>
            <dd className="aq-cod-bill-total">{INR(s.total)}</dd>
          </dl>
        </section>

        <div className="aq-cod-actions">
          <a
            className="aq-cod-help"
            href={help}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={15} aria-hidden="true" /> Questions? Ask us on
            WhatsApp
          </a>
          <span className="aq-cod-actions-btns">
            <button
              type="button"
              className="aq-btn aq-btn-ghost"
              onClick={p.onNewChat}
            >
              New chat
            </button>
            {p.onViewProduct && (
              <button
                type="button"
                className="aq-btn aq-btn-glass"
                onClick={p.onViewProduct}
              >
                View product
              </button>
            )}
            {p.onViewOrders && (
              <button
                type="button"
                className="aq-btn aq-btn-glass"
                onClick={p.onViewOrders}
              >
                View my orders
              </button>
            )}
            <button
              type="button"
              className="aq-btn aq-btn-dark"
              onClick={p.onContinue}
            >
              Continue chatting
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
