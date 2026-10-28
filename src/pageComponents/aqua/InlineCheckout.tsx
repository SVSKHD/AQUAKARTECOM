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
import {
  BadgePercent,
  Banknote,
  Check,
  Lock,
  Minus,
  Plus,
  Smartphone,
  Trash,
} from "lucide-react";
import { quote } from "@/utils/aquaCommerce";
import AnimatedAmount from "./AnimatedAmount";
import { INR } from "./catalogue";
import CheckoutAddress from "./CheckoutAddress";
import {
  cartCouponOffers,
  couponTitle,
  type ActiveCoupon,
  type CartCouponOffer,
} from "./coupons";
import type { Address, CheckoutDraft, PayMethod, QuoteState } from "./types";

type Props = {
  draft: CheckoutDraft;
  setDraft: Dispatch<SetStateAction<CheckoutDraft | null>>;
  savedAddresses: Address[];
  // Active store coupons (GET /coupons/active), shown as cards to apply.
  coupons: ActiveCoupon[];
  categoryOf: (productId: string) => string;
  quoteState: QuoteState;
  setQuoteState: Dispatch<SetStateAction<QuoteState>>;
  commerceLive: boolean;
  catalogueLive: boolean;
  signedIn: boolean;
  token: string | null;
  onPay: () => void;
  // Live catalogue but no session: payment (online or COD) needs an account,
  // as on /checkout. The draft stays put while the customer signs in.
  onSignIn: () => void;
  // The account's default address (tagged in the list).
  defaultAddress?: Address | null;
  // Adds a new address to the account from checkout; resolves with the stored copy.
  onSaveAddress?: (address: Address) => Promise<Address>;
};

const SLOTS = ["9 am – 12 pm", "12 pm – 3 pm", "3 pm – 6 pm"];

const PAY_METHODS: {
  id: PayMethod;
  title: string;
  text: string;
  Icon: typeof Smartphone;
  tags: string[];
}[] = [
  {
    id: "online",
    title: "Pay online",
    text: "Secure PhonePe checkout. Confirmed as soon as it's paid.",
    Icon: Smartphone,
    tags: ["UPI", "Cards", "Net banking", "Wallets"],
  },
  {
    id: "cod",
    title: "Cash on delivery",
    text: "Place the order now and pay when it's delivered.",
    Icon: Banknote,
    tags: ["Pay at your door"],
  },
];

// Cards shown before "Show more".
const COUPONS_SHOWN = 4;

function CouponCard({
  offer,
  applied,
  onApply,
}: {
  offer: CartCouponOffer;
  applied: boolean;
  onApply: () => void;
}) {
  const c = offer.coupon;
  const ends = dayjs(c.endsAt);
  const terms = [
    c.minimumOrder ? `Min. order ${INR(c.minimumOrder)}` : "",
    c.firstOrderOnly ? "First order only" : "",
    ends.isValid() ? `Ends ${ends.format("D MMM")}` : "",
  ].filter(Boolean);
  return (
    <div
      className="aq-coupon"
      data-eligible={offer.eligible}
      data-applied={applied}
    >
      <span className="aq-coupon-stub" aria-hidden="true">
        <BadgePercent size={16} />
        {offer.save > 0 && (
          <>
            <span className="aq-coupon-save-label">Save</span>
            <span className="aq-coupon-save">{INR(offer.save)}</span>
          </>
        )}
      </span>
      <span className="aq-coupon-body">
        <span className="aq-mono aq-coupon-code">{c.code}</span>
        <span className="aq-coupon-title">{couponTitle(c)}</span>
        {c.description && c.discountType !== "fixed" && (
          <span className="aq-coupon-terms">{c.description}</span>
        )}
        {terms.length > 0 && (
          <span className="aq-coupon-terms">{terms.join(" · ")}</span>
        )}
      </span>
      {applied ? (
        <span className="aq-coupon-applied">
          <Check size={14} /> Applied
        </span>
      ) : offer.eligible ? (
        <button
          type="button"
          className="aq-btn aq-coupon-apply"
          onClick={onApply}
          aria-label={`Apply ${c.code}, save ${INR(offer.save)}`}
        >
          Apply
        </button>
      ) : (
        <span className="aq-coupon-note">{offer.note}</span>
      )}
    </div>
  );
}

export function validate(d: CheckoutDraft) {
  const missing: string[] = [];
  if (!d.name.trim()) missing.push("your name");
  if (!/^[6-9]\d{9}$/.test(d.phone)) missing.push("a 10-digit mobile number");
  if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) missing.push("a valid email");
  if (!d.address.street.trim() || !d.address.city.trim())
    missing.push("your address");
  // POST /payments rejects an address without a state.
  if (!(d.address.state || "").trim()) missing.push("your state");
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
  coupons,
  categoryOf,
  quoteState,
  setQuoteState,
  commerceLive,
  catalogueLive,
  signedIn,
  token,
  onPay,
  onSignIn,
  defaultAddress,
  onSaveAddress,
}: Props) {
  const [couponInput, setCouponInput] = useState(draft.coupon);
  // A coupon picked elsewhere (the history dock) shows up in the field too.
  useEffect(() => setCouponInput(draft.coupon), [draft.coupon]);
  // A new address is being typed: checkout waits until it's confirmed.
  const [addingAddress, setAddingAddress] = useState(false);
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
  const missing = [
    ...validate(draft),
    ...(addingAddress ? ["the new address (press “Use this address”)"] : []),
  ];
  const subtotal = draft.items.reduce((a, i) => a + i.price * i.qty, 0);
  const offers = useMemo(
    () =>
      cartCouponOffers(
        coupons,
        draft.items.map((i) => ({ id: i.id, category: categoryOf(i.id) })),
        subtotal,
      ),
    // categoryOf is rebuilt every render; the items decide the categories.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coupons, draft.items, subtotal],
  );
  const [allCoupons, setAllCoupons] = useState(false);
  const shownOffers = allCoupons ? offers : offers.slice(0, COUPONS_SHOWN);
  const applyCode = (code: string) => {
    setCouponInput(code);
    update({ coupon: code });
  };
  const cod = draft.payMethod === "cod";

  // Re-quote on qty / coupon change, debounced 400ms. Only the server's numbers are shown.
  const quoteKey = JSON.stringify([
    draft.items.map((i) => [i.id, i.qty]),
    draft.coupon,
  ]);
  useEffect(() => {
    let alive = true;
    if (commerceLive) setQuoteState({ status: "loading" });
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
  // The last live quote stays on screen (dimmed, numbers animating to the
  // new ones) while the next one loads, so nothing blinks or reflows.
  const [lastLive, setLastLive] = useState<typeof q>(null);
  useEffect(() => {
    if (q && !q.demo) setLastLive(q);
  }, [q]);
  const pricing = quoteState.status === "loading";
  const shownQ = q ?? (pricing ? lastLive : null);
  const updating = pricing && !!lastLive;
  const liveTotal =
    shownQ && !shownQ.demo && shownQ.data.payableAmount != null
      ? Number(shownQ.data.payableAmount)
      : null;
  const canPay = missing.length === 0 && !!q && (q.demo ? !commerceLive : true);
  const needsSignIn = catalogueLive && !signedIn;

  const setQty = (idx: number, qty: number) =>
    update({
      items: draft.items.map((it, j) =>
        j === idx ? { ...it, qty: Math.max(1, Math.min(10, qty)) } : it,
      ),
    });

  // Two columns when the panel is wide enough (a container query on .aq-co):
  // your details on the left, your order on the right with the Pay button
  // pinned at its foot, so it never needs a scroll to reach. One column with a
  // sticky Pay bar otherwise.
  return (
    <div className="aq-co">
      <div className="aq-co-scroll aq-noscroll">
        <div className="aq-co-grid">
          <div className="aq-co-main aq-noscroll">
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
                {needsSignIn
                  ? "Sign in to get your live price and pay online or by cash on delivery. Your details here are kept."
                  : "Preview mode · demo catalogue, no live pricing. No payment gateway is connected here."}
              </div>
            )}

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

            <Section n={2} title="Delivery address">
              <CheckoutAddress
                address={draft.address}
                savedAddressId={draft.savedAddressId}
                saved={savedAddresses}
                defaultAddress={defaultAddress}
                signedIn={signedIn}
                onPick={(address, savedId) =>
                  update({ address, savedAddressId: savedId })
                }
                onChange={setAddr}
                onSave={signedIn ? onSaveAddress : undefined}
                onAddingChange={setAddingAddress}
              />
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
                      style={{
                        minWidth: 76,
                        alignItems: "center",
                        flexShrink: 0,
                      }}
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
          </div>

          <aside className="aq-co-side" aria-label="Your order">
            <div className="aq-co-side-scroll aq-noscroll">
              <span className="aq-co-kicker">Your order</span>
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
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          lineHeight: 1.3,
                        }}
                      >
                        {it.title}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--aq-mut)" }}>
                        {it.variantLabel ? `${it.variantLabel} · ` : ""}
                        {INR(it.price)} each
                        {it.qty > 1 && (
                          <>
                            {" · "}
                            <b style={{ color: "var(--aq-ink)" }}>
                              <AnimatedAmount value={it.price * it.qty} />
                            </b>
                          </>
                        )}
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
                      {/* Re-keyed so each change replays the bump. */}
                      <span
                        key={it.qty}
                        className="aq-qty-bump"
                        style={{ fontSize: 14 }}
                        aria-live="polite"
                      >
                        {it.qty}
                      </span>
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
                          update({
                            items: draft.items.filter((_, j) => j !== idx),
                          })
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
                n={4}
                title="Offers & coupons"
                aside={
                  offers.some((o) => o.eligible) ? (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--aq-mintink)",
                        fontWeight: 700,
                      }}
                    >
                      {offers.filter((o) => o.eligible).length} available
                    </span>
                  ) : null
                }
              >
                {shownOffers.length > 0 && (
                  <div className="aq-coupons">
                    {shownOffers.map((o) => (
                      <CouponCard
                        key={o.coupon.code}
                        offer={o}
                        applied={draft.coupon === o.coupon.code}
                        onApply={() => applyCode(o.coupon.code)}
                      />
                    ))}
                  </div>
                )}
                {offers.length > COUPONS_SHOWN && (
                  <button
                    type="button"
                    className="aq-hard-link"
                    onClick={() => setAllCoupons((v) => !v)}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {allCoupons
                      ? "Show fewer offers"
                      : `Show ${offers.length - COUPONS_SHOWN} more offers`}
                  </button>
                )}
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
                    {draft.coupon} is checked by the server when the order is
                    priced.
                  </span>
                )}
              </Section>

              <Section n={5} title="Payment method">
                <div
                  role="radiogroup"
                  aria-label="Payment method"
                  className="aq-paymethods"
                >
                  {PAY_METHODS.map(({ id, title, text, Icon, tags }) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={draft.payMethod === id}
                      className="aq-option aq-paymethod"
                      onClick={() => update({ payMethod: id })}
                    >
                      <span className="aq-paymethod-head">
                        <span className="aq-paymethod-icon" aria-hidden="true">
                          <Icon size={18} />
                        </span>
                        <span
                          style={{ fontSize: 14.5, fontWeight: 700, flex: 1 }}
                        >
                          {title}
                        </span>
                        <span
                          className="aq-paymethod-radio"
                          aria-hidden="true"
                        />
                      </span>
                      <span
                        style={{
                          fontSize: 12.5,
                          color: "var(--aq-mut)",
                          lineHeight: 1.45,
                        }}
                      >
                        {text}
                      </span>
                      <span className="aq-paymethod-tags">
                        {tags.map((t) => (
                          <span key={t} className="aq-paymethod-tag">
                            {t}
                          </span>
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section
                n={6}
                title="Order total"
                aside={
                  updating ? (
                    <span className="aq-co-updating" role="status">
                      <span className="aq-loadbtn-spin" aria-hidden="true" />
                      Updating…
                    </span>
                  ) : null
                }
              >
                {quoteState.status === "error" ? (
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
                ) : shownQ?.demo ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      fontSize: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "var(--aq-mut)" }}>
                        Items ({draft.items.reduce((a, i) => a + i.qty, 0)})
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        <AnimatedAmount value={subtotal} />
                      </span>
                    </div>
                    <span
                      className="aq-mono"
                      style={{ fontSize: 11.5, color: "var(--aq-mut)" }}
                    >
                      Preview estimate · shipping, taxes and offers come from
                      the server quote on the live site
                    </span>
                  </div>
                ) : shownQ ? (
                  <div className="aq-co-totals" data-updating={updating}>
                    {shownQ.data.subtotal != null && (
                      <div className="aq-co-line">
                        <span style={{ color: "var(--aq-mut)" }}>Subtotal</span>
                        <span style={{ fontWeight: 600 }}>
                          <AnimatedAmount
                            value={Number(shownQ.data.subtotal)}
                          />
                        </span>
                      </div>
                    )}
                    {!!shownQ.data.discount && (
                      <div className="aq-co-line" style={{ color: "#9A4A12" }}>
                        <span>
                          Discount
                          {shownQ.data.coupon?.code || shownQ.data.couponCode
                            ? ` (${shownQ.data.coupon?.code || shownQ.data.couponCode})`
                            : ""}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          <AnimatedAmount
                            value={Number(shownQ.data.discount)}
                            prefix="−"
                          />
                        </span>
                      </div>
                    )}
                    {!!shownQ.data.rewardCredit && (
                      <div
                        className="aq-co-line"
                        style={{ color: "var(--aq-mintink)" }}
                      >
                        <span>Reward credit</span>
                        <span style={{ fontWeight: 600 }}>
                          <AnimatedAmount
                            value={Number(shownQ.data.rewardCredit)}
                            prefix="−"
                          />
                        </span>
                      </div>
                    )}
                    {shownQ.data.deliveryCharge != null && (
                      <div className="aq-co-line">
                        <span style={{ color: "var(--aq-mut)" }}>Delivery</span>
                        <span style={{ fontWeight: 600 }}>
                          {Number(shownQ.data.deliveryCharge) ? (
                            <AnimatedAmount
                              value={Number(shownQ.data.deliveryCharge)}
                            />
                          ) : (
                            "Free"
                          )}
                        </span>
                      </div>
                    )}
                    {shownQ.data.tax != null && (
                      <div className="aq-co-line">
                        <span style={{ color: "var(--aq-mut)" }}>Tax</span>
                        <span style={{ fontWeight: 600 }}>
                          <AnimatedAmount value={Number(shownQ.data.tax)} />
                        </span>
                      </div>
                    )}
                    <div className="aq-co-line aq-co-line-total">
                      <span style={{ fontWeight: 700 }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: 20 }}>
                        {liveTotal != null && (
                          <AnimatedAmount value={liveTotal} />
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  // First price on its way: rows the size of the real ones.
                  <div
                    className="aq-co-totals"
                    role="status"
                    aria-label="Getting the price from Aquakart"
                  >
                    {[62, 48, 54].map((w) => (
                      <div key={w} className="aq-co-line">
                        <span
                          className="aq-co-skel"
                          style={{ width: `${w}px` }}
                        />
                        <span
                          className="aq-co-skel"
                          style={{ width: "70px" }}
                        />
                      </div>
                    ))}
                    <div className="aq-co-line aq-co-line-total">
                      <span className="aq-co-skel" style={{ width: "44px" }} />
                      <span
                        className="aq-co-skel"
                        style={{ width: "110px", height: "1.4em" }}
                      />
                    </div>
                  </div>
                )}
              </Section>
            </div>

            <div className="aq-co-pay">
              {liveTotal != null && (
                <div className="aq-co-total" data-updating={updating}>
                  <span>{cod ? "Pay on delivery" : "Total"}</span>
                  <b>
                    <AnimatedAmount value={liveTotal} />
                  </b>
                </div>
              )}
              <button
                type="button"
                className="aq-btn aq-btn-primary aq-paybtn"
                onClick={needsSignIn ? onSignIn : onPay}
                disabled={needsSignIn ? missing.length > 0 : !canPay}
                data-ready={needsSignIn ? missing.length === 0 : canPay}
                data-updating={!needsSignIn && updating}
                aria-busy={!needsSignIn && updating}
              >
                {!needsSignIn && updating ? (
                  <span className="aq-loadbtn-spin" aria-hidden="true" />
                ) : cod ? (
                  <Banknote size={16} />
                ) : (
                  <Lock size={16} />
                )}{" "}
                {needsSignIn ? (
                  cod ? (
                    "Sign in to place order"
                  ) : (
                    "Sign in to pay"
                  )
                ) : !commerceLive ? (
                  "Continue (preview)"
                ) : cod ? (
                  <>
                    Place order · pay
                    {liveTotal != null && (
                      <>
                        {" "}
                        <AnimatedAmount value={liveTotal} />
                      </>
                    )}{" "}
                    on delivery
                  </>
                ) : (
                  <>
                    Pay
                    {liveTotal != null && (
                      <>
                        {" "}
                        <AnimatedAmount value={liveTotal} />
                      </>
                    )}{" "}
                    securely with PhonePe
                  </>
                )}
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
                  {cod
                    ? "Nothing is charged now. Pay the amount above when your order is delivered."
                    : "Card and UPI details are entered only in PhonePe's secure window, never on this page."}
                </span>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
