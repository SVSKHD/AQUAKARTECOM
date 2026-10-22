"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import dayjs from "dayjs";
import { Lock, Minus, Plus, Trash } from "lucide-react";
import { quote } from "@/utils/aquaCommerce";
import { INR } from "./catalogue";
import type { Address, CheckoutDraft, QuoteState } from "./types";

type Props = {
  draft: CheckoutDraft;
  setDraft: Dispatch<SetStateAction<CheckoutDraft | null>>;
  savedAddresses: Address[];
  quoteState: QuoteState;
  setQuoteState: Dispatch<SetStateAction<QuoteState>>;
  commerceLive: boolean;
  catalogueLive: boolean;
  signedIn: boolean;
  token: string | null;
  onPay: () => void;
};

const SLOTS = ["9 am – 12 pm", "12 pm – 3 pm", "3 pm – 6 pm"];
const addrKey = (a: Address) =>
  a._id || `${a.street}|${a.city}|${a.postalCode}`;

export function validate(d: CheckoutDraft) {
  const missing: string[] = [];
  if (!d.name.trim()) missing.push("your name");
  if (!/^[6-9]\d{9}$/.test(d.phone)) missing.push("a 10-digit mobile number");
  if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) missing.push("a valid email");
  if (!d.address.street.trim() || !d.address.city.trim())
    missing.push("your address");
  if (!/^\d{6}$/.test(d.address.postalCode)) missing.push("a 6-digit PIN code");
  if (!d.slotDay || !d.slotTime) missing.push("an installation slot");
  return missing;
}

function Section({
  n,
  title,
  children,
  aside,
}: {
  n: number;
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section
      className="aq-card"
      style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "var(--aq-mint)",
            color: "#008B68",
            fontSize: 13,
            fontWeight: 800,
            display: "grid",
            placeItems: "center",
          }}
        >
          {n}
        </span>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15, flex: 1 }}>
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

// Reuses the checkout page's rules (quote endpoint, address shape, PhonePe order)
// without its page layout or redirects. Form state lives in AquaWorkspace so a
// parked checkout comes back intact.
export default function InlineCheckout({
  draft,
  setDraft,
  savedAddresses,
  quoteState,
  setQuoteState,
  commerceLive,
  catalogueLive,
  signedIn,
  token,
  onPay,
}: Props) {
  const [couponInput, setCouponInput] = useState(draft.coupon);
  const [editingAddress, setEditingAddress] = useState(!draft.savedAddressId);
  const update = (patch: Partial<CheckoutDraft>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));
  const setAddr = (patch: Partial<Address>) =>
    setDraft((d) =>
      d
        ? { ...d, savedAddressId: null, address: { ...d.address, ...patch } }
        : d,
    );

  const days = useMemo(
    () => Array.from({ length: 5 }, (_, i) => dayjs().add(i + 2, "day")),
    [],
  );
  const missing = validate(draft);
  const subtotal = draft.items.reduce((a, i) => a + i.price * i.qty, 0);

  // Re-quote on qty / coupon change, debounced 400ms. Only the server's numbers are shown.
  const quoteKey = JSON.stringify([
    draft.items.map((i) => [i.id, i.qty]),
    draft.coupon,
  ]);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      if (!commerceLive) {
        setQuoteState({
          status: "ready",
          demo: true,
          data: { subtotal, payableAmount: subtotal },
        });
        return;
      }
      setQuoteState({ status: "loading" });
      try {
        const q = await quote(draft.items, draft.coupon, token);
        if (alive) setQuoteState({ status: "ready", demo: false, data: q });
      } catch (e) {
        if (alive)
          setQuoteState({
            status: "error",
            error: (e as Error)?.message || "Couldn't price this order.",
          });
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // quoteKey captures items/qty/coupon
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey, commerceLive, token]);

  const q = quoteState.status === "ready" ? quoteState : null;
  const canPay = missing.length === 0 && !!q && (q.demo ? !commerceLive : true);

  const setQty = (idx: number, qty: number) =>
    update({
      items: draft.items.map((it, j) =>
        j === idx ? { ...it, qty: Math.max(1, Math.min(10, qty)) } : it,
      ),
    });

  return (
    <div
      className="aq-noscroll"
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        padding: "76px 16px 28px",
      }}
    >
      <div
        style={{
          maxWidth: 620,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2
            className="aq-display"
            style={{ margin: 0, fontSize: 24, fontWeight: 700 }}
          >
            Checkout
          </h2>
          <span style={{ fontSize: 14, color: "var(--aq-mut)" }}>
            Your conversation with Aqua stays open alongside.
          </span>
        </div>

        {!commerceLive && (
          <div
            role="note"
            className="aq-mono"
            style={{
              border: "1px dashed #B9CFCB",
              borderRadius: 14,
              padding: "10px 12px",
              fontSize: 11.5,
              color: "var(--aq-mut)",
              lineHeight: 1.5,
            }}
          >
            Preview mode ·{" "}
            {catalogueLive
              ? "sign in on aquakart.co.in to get a live quote and pay"
              : "demo catalogue, no live pricing"}
            . No payment gateway is connected here.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {draft.items.map((it, idx) => (
            <div
              key={it.id}
              className="aq-card"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: 10,
              }}
            >
              <span
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  flexShrink: 0,
                  background: it.photo
                    ? `center / cover no-repeat url("${it.photo}")`
                    : "repeating-linear-gradient(135deg, var(--aq-mint) 0 6px, var(--aq-tint) 6px 12px)",
                }}
              />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}
                >
                  {it.title}
                </span>
                <span style={{ fontSize: 12, color: "var(--aq-mut)" }}>
                  {it.variantLabel ? `${it.variantLabel} · ` : ""}
                  {INR(it.price)} each
                </span>
              </div>
              <div className="aq-stepper" style={{ height: 36 }}>
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${it.title}`}
                  onClick={() => setQty(idx, it.qty - 1)}
                  style={{ height: 34 }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: 14 }}>{it.qty}</span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${it.title}`}
                  onClick={() => setQty(idx, it.qty + 1)}
                  style={{ height: 34 }}
                >
                  <Plus size={14} />
                </button>
              </div>
              {draft.items.length > 1 && (
                <button
                  type="button"
                  className="aq-icon-btn"
                  aria-label={`Remove ${it.title}`}
                  onClick={() =>
                    update({ items: draft.items.filter((_, j) => j !== idx) })
                  }
                  style={{
                    border: 0,
                    background: "transparent",
                    boxShadow: "none",
                    color: "var(--aq-mut2)",
                  }}
                >
                  <Trash size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        <Section
          n={1}
          title="Contact"
          aside={
            !signedIn ? (
              <span style={{ fontSize: 12, color: "var(--aq-mut)" }}>
                Guest
              </span>
            ) : null
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 10,
            }}
          >
            <label className="aq-field">
              Full name
              <input
                className="aq-input"
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                autoComplete="name"
              />
            </label>
            <label className="aq-field">
              Mobile number
              <input
                className="aq-input"
                value={draft.phone}
                onChange={(e) =>
                  update({
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10 digits"
              />
            </label>
            <label className="aq-field" style={{ gridColumn: "1 / -1" }}>
              Email (for the invoice)
              <input
                className="aq-input"
                type="email"
                value={draft.email}
                onChange={(e) => update({ email: e.target.value })}
                autoComplete="email"
              />
            </label>
          </div>
        </Section>

        <Section
          n={2}
          title="Delivery address"
          aside={
            savedAddresses.length > 0 && !editingAddress ? (
              <button
                type="button"
                className="aq-chip"
                onClick={() => setEditingAddress(true)}
              >
                Edit
              </button>
            ) : null
          }
        >
          {savedAddresses.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              {savedAddresses.map((a, i) => (
                <button
                  key={addrKey(a)}
                  type="button"
                  className="aq-option"
                  aria-pressed={
                    !editingAddress && addrKey(a) === addrKey(draft.address)
                  }
                  onClick={() => {
                    update({
                      address: { ...a },
                      savedAddressId: a._id ?? null,
                    });
                    setEditingAddress(false);
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    {a.label || `Address ${i + 1}`}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--aq-mut)",
                      lineHeight: 1.45,
                    }}
                  >
                    {[a.street, a.city, a.state, a.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="aq-option"
                aria-pressed={editingAddress && !draft.savedAddressId}
                onClick={() => {
                  setAddr({ street: "", city: "", state: "", postalCode: "" });
                  setEditingAddress(true);
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  + New address
                </span>
                <span style={{ fontSize: 12, color: "var(--aq-mut)" }}>
                  Used for this order only
                </span>
              </button>
            </div>
          )}
          {(editingAddress || savedAddresses.length === 0) && (
            <>
              <label className="aq-field">
                House, street, area
                <input
                  className="aq-input"
                  value={draft.address.street}
                  onChange={(e) => setAddr({ street: e.target.value })}
                  autoComplete="street-address"
                />
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 10,
                }}
              >
                <label className="aq-field">
                  City
                  <input
                    className="aq-input"
                    value={draft.address.city}
                    onChange={(e) => setAddr({ city: e.target.value })}
                    autoComplete="address-level2"
                  />
                </label>
                <label className="aq-field">
                  State
                  <input
                    className="aq-input"
                    value={draft.address.state || ""}
                    onChange={(e) => setAddr({ state: e.target.value })}
                    autoComplete="address-level1"
                  />
                </label>
                <label className="aq-field">
                  PIN code
                  <input
                    className="aq-input"
                    value={draft.address.postalCode}
                    onChange={(e) =>
                      setAddr({
                        postalCode: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6),
                      })
                    }
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </label>
              </div>
            </>
          )}
        </Section>

        <Section n={3} title="Installation slot">
          <div
            className="aq-noscroll"
            style={{ display: "flex", gap: 8, overflowX: "auto" }}
          >
            {days.map((d) => {
              const v = d.format("YYYY-MM-DD");
              return (
                <button
                  key={v}
                  type="button"
                  className="aq-option"
                  aria-pressed={draft.slotDay === v}
                  onClick={() => update({ slotDay: v })}
                  style={{ minWidth: 76, alignItems: "center", flexShrink: 0 }}
                >
                  <span style={{ fontSize: 12, color: "var(--aq-mut)" }}>
                    {d.format("ddd")}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>
                    {d.format("D MMM")}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 8,
            }}
          >
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                className="aq-option"
                aria-pressed={draft.slotTime === s}
                onClick={() => update({ slotTime: s })}
                style={{ minHeight: 44, fontSize: 13.5, fontWeight: 600 }}
              >
                {s}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--aq-mut)" }}>
            Our team confirms the slot by phone after delivery.
          </span>
        </Section>

        <Section n={4} title="Coupon">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update({ coupon: couponInput.trim().toUpperCase() });
            }}
            style={{ display: "flex", gap: 8 }}
          >
            <input
              className="aq-input"
              aria-label="Coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Have a code?"
              style={{ textTransform: "uppercase" }}
            />
            <button
              type="submit"
              className="aq-btn"
              style={{
                height: 42,
                borderRadius: 12,
                background: "var(--aq-mint)",
                color: "var(--aq-mintink)",
              }}
            >
              Apply
            </button>
            {draft.coupon && (
              <button
                type="button"
                className="aq-btn aq-btn-ghost"
                onClick={() => {
                  setCouponInput("");
                  update({ coupon: "" });
                }}
                style={{ height: 42 }}
              >
                Remove
              </button>
            )}
          </form>
          {draft.coupon && (
            <span style={{ fontSize: 12.5, color: "var(--aq-mut)" }}>
              {draft.coupon} is checked by the server when the order is priced.
            </span>
          )}
        </Section>

        <Section n={5} title="Order total">
          {quoteState.status === "loading" || quoteState.status === "idle" ? (
            <span
              role="status"
              style={{ fontSize: 14, color: "var(--aq-mut)" }}
            >
              Getting the price from Aquakart…
            </span>
          ) : quoteState.status === "error" ? (
            <div
              role="alert"
              style={{
                background: "#FDECEC",
                color: "#8A1F1F",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {quoteState.error}
            </div>
          ) : q?.demo ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--aq-mut)" }}>
                  Items ({draft.items.reduce((a, i) => a + i.qty, 0)})
                </span>
                <span style={{ fontWeight: 600 }}>{INR(subtotal)}</span>
              </div>
              <span
                className="aq-mono"
                style={{ fontSize: 11.5, color: "var(--aq-mut)" }}
              >
                Preview estimate · shipping, taxes and offers come from the
                server quote on the live site
              </span>
            </div>
          ) : (
            q && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 14,
                }}
              >
                {q.data.subtotal != null && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "var(--aq-mut)" }}>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>
                      {INR(q.data.subtotal)}
                    </span>
                  </div>
                )}
                {!!q.data.discount && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#9A4A12",
                    }}
                  >
                    <span>
                      Discount
                      {q.data.couponCode ? ` (${q.data.couponCode})` : ""}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      −{INR(q.data.discount)}
                    </span>
                  </div>
                )}
                {q.data.deliveryCharge != null && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "var(--aq-mut)" }}>Delivery</span>
                    <span style={{ fontWeight: 600 }}>
                      {Number(q.data.deliveryCharge)
                        ? INR(q.data.deliveryCharge)
                        : "Free"}
                    </span>
                  </div>
                )}
                {q.data.tax != null && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "var(--aq-mut)" }}>Tax</span>
                    <span style={{ fontWeight: 600 }}>{INR(q.data.tax)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--aq-bd)",
                    paddingTop: 12,
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: 20 }}>
                    {INR(q.data.payableAmount)}
                  </span>
                </div>
              </div>
            )
          )}
        </Section>

        <button
          type="button"
          className="aq-btn aq-btn-primary"
          onClick={onPay}
          disabled={!canPay}
          style={{ height: 48, fontSize: 15 }}
        >
          <Lock size={16} />{" "}
          {commerceLive ? "Pay securely with PhonePe" : "Continue (preview)"}
        </button>
        {missing.length > 0 ? (
          <span
            style={{
              fontSize: 12.5,
              color: "var(--aq-mut)",
              textAlign: "center",
            }}
          >
            To continue, add {missing.join(", ")}.
          </span>
        ) : (
          <span
            style={{
              fontSize: 12,
              color: "var(--aq-mut)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Card and UPI details are entered only in PhonePe&apos;s secure
            window, never on this page.
          </span>
        )}
      </div>
    </div>
  );
}
