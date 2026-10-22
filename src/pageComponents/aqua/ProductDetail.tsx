"use client";

import { useState } from "react";
import {
  Check,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import { checkDelivery, type DeliveryCheck } from "@/services/delivery";
import AquaDroplet from "./AquaDroplet";
import { INR } from "./catalogue";
import { stockColors } from "./ProductCard";
import type { Product, Selection } from "./types";

type Props = {
  product: Product;
  selection: Selection;
  onSelection: (patch: Partial<Selection>) => void;
  reason?: string;
  isFav: boolean;
  inCart: boolean;
  inCompare: boolean;
  onAddToCart: (id: string, qty: number) => void;
  onToggleFav: (id: string) => void;
  onToggleCompare: (id: string) => void;
  // Replaces AquaProductRevamp's router.push("/checkout").
  onBuy: () => void;
  onAsk: (text: string) => void;
  dark: boolean;
  isMobile: boolean;
};

const ASK = [
  "Capacity",
  "Maintenance",
  "Installation",
  "Warranty",
  "Show alternatives",
];

export default function ProductDetail({
  product: p,
  selection,
  onSelection,
  reason,
  isFav,
  inCart,
  inCompare,
  onAddToCart,
  onToggleFav,
  onToggleCompare,
  onBuy,
  onAsk,
  dark,
  isMobile,
}: Props) {
  const [img, setImg] = useState(0);
  const [pin, setPin] = useState("");
  const [pinState, setPinState] = useState<{
    loading: boolean;
    result: DeliveryCheck | null;
  }>({ loading: false, result: null });
  const sc = stockColors(p);
  const photos = p.photos.length ? p.photos : [];

  const runCheck = async () => {
    setPinState({ loading: true, result: null });
    const result = await checkDelivery(pin);
    setPinState({ loading: false, result });
  };

  const facts = [
    { k: "Capacity", v: p.capacity },
    { k: "Maintenance", v: p.maintenance },
    { k: "Installation", v: p.install },
    { k: "Warranty", v: p.warranty },
  ];
  const specs = [
    ["Capacity", p.capacity],
    ["Flow rate", p.flow],
    ["Household", p.maxPeople ? `Up to ${p.maxPeople} people` : ""],
    ["Max hardness", p.maxPpm ? `${p.maxPpm} ppm` : ""],
    ["Regeneration", p.regen],
    ["Warranty", p.warranty],
  ].filter(([, v]) => !!v) as [string, string][];

  return (
    <>
      <div
        className="aq-noscroll"
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          padding: isMobile ? "72px 14px 110px" : "76px 24px 110px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: isMobile ? 18 : 28,
            alignItems: "start",
          }}
        >
          {/* gallery */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 26,
                overflow: "hidden",
                background: "var(--aq-surf)",
                border: "1px solid rgba(var(--aq-gl),.9)",
                boxShadow: "0 14px 30px rgba(var(--aq-sh),.08)",
                animation: "aqZoom .5s cubic-bezier(.22,.8,.24,1) both",
              }}
            >
              {photos[img] ? (
                <div
                  role="img"
                  aria-label={p.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    background: `center / contain no-repeat url("${photos[img]}")`,
                  }}
                />
              ) : (
                <div
                  className="aq-mono"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    background:
                      "repeating-linear-gradient(135deg, var(--aq-mint) 0 12px, var(--aq-tint) 12px 24px)",
                    fontSize: 12,
                    color: "var(--aq-mut)",
                  }}
                >
                  product shot
                </div>
              )}
            </div>
            {photos.length > 1 && (
              <div
                style={{ display: "flex", gap: 10, overflowX: "auto" }}
                className="aq-noscroll"
              >
                {photos.slice(0, 6).map((ph, i) => (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => setImg(i)}
                    aria-label={`Photo ${i + 1}`}
                    aria-pressed={img === i}
                    style={{
                      width: 64,
                      height: 64,
                      flexShrink: 0,
                      borderRadius: 16,
                      overflow: "hidden",
                      padding: 0,
                      cursor: "pointer",
                      border: `2px solid ${img === i ? "#10BFA4" : "transparent"}`,
                      background: `var(--aq-surf) center / cover no-repeat url("${ph}")`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="aq-label" style={{ fontSize: 12 }}>
                {p.brand}
              </span>
              <div
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <h2
                  className="aq-display"
                  style={{
                    margin: 0,
                    flex: 1,
                    fontSize: isMobile ? 22 : 26,
                    lineHeight: 1.18,
                    fontWeight: 700,
                    textWrap: "balance",
                  }}
                >
                  {p.title}
                </h2>
                <button
                  type="button"
                  className="aq-icon-btn"
                  onClick={() => onToggleFav(p.id)}
                  aria-label={
                    isFav ? "Remove from favourites" : "Save to favourites"
                  }
                  aria-pressed={isFav}
                  style={{
                    width: 40,
                    height: 40,
                    color: isFav ? "#E0476B" : "var(--aq-ink)",
                  }}
                >
                  <Heart size={17} fill={isFav ? "#E0476B" : "none"} />
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="aq-display"
                  style={{ fontSize: 30, fontWeight: 700 }}
                >
                  {INR(p.price)}
                </span>
                {p.mrp > p.price && (
                  <span
                    style={{
                      fontSize: 15,
                      color: "var(--aq-mut2)",
                      textDecoration: "line-through",
                    }}
                  >
                    {INR(p.mrp)}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: sc.bg,
                    color: sc.fg,
                  }}
                >
                  {p.stock}
                </span>
              </div>
            </div>

            {reason && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "rgba(var(--aq-mintrgb),.95)",
                  borderRadius: 18,
                  padding: "14px 16px",
                }}
              >
                <div style={{ width: 28, flexShrink: 0 }}>
                  <AquaDroplet mood="idle" size={28} dark={dark} still />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "var(--aq-mintink2)",
                  }}
                >
                  <strong>Why Aqua picked this</strong>
                  <span>{reason}</span>
                </div>
              </div>
            )}

            {p.variants && p.variants.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--aq-mut)",
                  }}
                >
                  Variant
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {p.variants.map((v, i) => (
                    <button
                      key={v}
                      type="button"
                      className="aq-option"
                      aria-pressed={selection.variant === i}
                      onClick={() => onSelection({ variant: i })}
                      style={{
                        minHeight: 44,
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {facts.map((f) => (
                <span
                  key={f.k}
                  title={f.v || "Not listed"}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: f.v ? "rgba(var(--aq-gl),.85)" : "transparent",
                    border: `1px ${f.v ? "solid" : "dashed"} var(--aq-bd)`,
                    color: f.v ? "var(--aq-ink)" : "var(--aq-mut2)",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.k}:{" "}
                  {f.k === "Capacity" || f.k === "Warranty"
                    ? f.v || "not listed"
                    : f.v
                      ? "see below"
                      : "not listed"}
                </span>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                borderTop: "1px solid rgba(var(--aq-ln),.08)",
                paddingTop: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                <Wrench
                  size={17}
                  style={{ color: "#008B68", flexShrink: 0, marginTop: 2 }}
                />
                <span>
                  <strong>Installation · </strong>
                  {p.install || "Not listed. Ask Aqua or an expert."}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                <ShieldCheck
                  size={17}
                  style={{ color: "#008B68", flexShrink: 0, marginTop: 2 }}
                />
                <span>
                  <strong>Warranty · </strong>
                  {p.warranty || "Not listed"}
                </span>
              </div>
            </div>

            <div
              className="aq-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                borderRadius: 18,
                padding: 14,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <MapPin size={16} style={{ color: "#008B68" }} /> Check delivery
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runCheck();
                }}
                style={{ display: "flex", gap: 8 }}
              >
                <input
                  className="aq-input"
                  inputMode="numeric"
                  maxLength={6}
                  aria-label="PIN code"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit PIN code"
                  style={{ height: 44, letterSpacing: ".06em" }}
                />
                <button
                  type="submit"
                  className="aq-btn"
                  disabled={pinState.loading}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    background: "var(--aq-mint)",
                    color: "var(--aq-mintink)",
                  }}
                >
                  {pinState.loading ? "Checking…" : "Check"}
                </button>
              </form>
              {pinState.result && (
                <span
                  role="status"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: pinState.result.ok ? "var(--aq-mintink)" : "#B42318",
                  }}
                >
                  {pinState.result.eta}
                </span>
              )}
              <span
                className="aq-mono"
                style={{ fontSize: 11, color: "var(--aq-mut2)" }}
              >
                Estimate only · live check needs the serviceability endpoint
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 28,
            marginTop: 30,
          }}
        >
          {specs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3
                className="aq-display"
                style={{ margin: 0, fontSize: 16, fontWeight: 700 }}
              >
                Key specifications
              </h3>
              <div
                className="aq-card"
                style={{ borderRadius: 18, overflow: "hidden" }}
              >
                {specs.map(([k, v], i) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "12px 16px",
                      borderTop: i ? "1px solid rgba(var(--aq-ln),.06)" : 0,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: "var(--aq-mut)" }}>{k}</span>
                    <span style={{ fontWeight: 600, textAlign: "right" }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3
              className="aq-display"
              style={{ margin: 0, fontSize: 16, fontWeight: 700 }}
            >
              About this product
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.65,
                color: "var(--aq-body)",
                textWrap: "pretty",
              }}
            >
              {p.desc || "No description listed yet."}
            </p>
            {p.maintenance && (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "var(--aq-body)",
                }}
              >
                <strong style={{ color: "var(--aq-ink)" }}>
                  Maintenance ·{" "}
                </strong>
                {p.maintenance}
              </p>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 6,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                Ask Aqua about this product
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ASK.filter((a) => a !== "Show alternatives" || !p.inStock).map(
                  (a) => (
                    <button
                      key={a}
                      type="button"
                      className="aq-chip"
                      onClick={() => onAsk(a)}
                    >
                      {a}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* action bar */}
      <div
        className="aq-glass"
        style={{
          position: "absolute",
          left: isMobile ? 8 : 12,
          right: isMobile ? 8 : 12,
          bottom: isMobile ? 8 : 12,
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 6 : 8,
          padding: isMobile ? 6 : "8px 8px 8px 14px",
          borderRadius: 20,
          background: "rgba(var(--aq-gl),.82)",
        }}
      >
        {!isMobile && (
          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 0 }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--aq-mut)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {selection.qty > 1
                ? `${selection.qty} × ${INR(p.price)}`
                : "Price"}
            </span>
            <span
              style={{ fontSize: 18, fontWeight: 800, whiteSpace: "nowrap" }}
            >
              {INR(p.price * selection.qty)}
            </span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        {p.inStock ? (
          <>
            <div className="aq-stepper">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() =>
                  onSelection({ qty: Math.max(1, selection.qty - 1) })
                }
              >
                <Minus size={15} />
              </button>
              <span aria-live="polite">{selection.qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() =>
                  onSelection({ qty: Math.min(10, selection.qty + 1) })
                }
              >
                <Plus size={15} />
              </button>
            </div>
            <button
              type="button"
              className="aq-icon-btn"
              onClick={() => onToggleCompare(p.id)}
              aria-pressed={inCompare}
              aria-label={inCompare ? "Remove from compare" : "Add to compare"}
              title="Compare"
              style={{
                width: 44,
                height: 44,
                fontSize: 11,
                fontWeight: 800,
                color: inCompare ? "var(--aq-mintink)" : "var(--aq-ink)",
                background: inCompare ? "var(--aq-mint)" : undefined,
              }}
            >
              VS
            </button>
            <button
              type="button"
              className="aq-icon-btn"
              onClick={() => onAddToCart(p.id, selection.qty)}
              aria-label={inCart ? "In cart, add more" : "Add to cart"}
              title="Add to cart"
              style={{
                width: 44,
                height: 44,
                color: inCart ? "#008B68" : "var(--aq-ink)",
              }}
            >
              {inCart ? <Check size={17} /> : <ShoppingCart size={17} />}
            </button>
            <button
              type="button"
              className="aq-btn aq-btn-primary"
              onClick={onBuy}
              style={{
                height: 44,
                padding: isMobile ? "0 14px" : undefined,
                flex: isMobile ? 1 : undefined,
              }}
            >
              {isMobile && selection.qty > 1
                ? `Buy · ${INR(p.price * selection.qty)}`
                : "Buy now"}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="aq-btn aq-btn-dark"
            onClick={() => onAsk("Show alternatives")}
            style={{ height: 44 }}
          >
            See alternatives
          </button>
        )}
      </div>
    </>
  );
}
