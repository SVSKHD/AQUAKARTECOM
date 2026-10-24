"use client";

import { useEffect } from "react";
import { Minus, Plus, Trash, X } from "lucide-react";
import { INR } from "./catalogue";

export type ShopTab = "cart" | "fav";
type Row = {
  id: string;
  title: string;
  price: number;
  photo?: string;
  qty: number;
};

type Props = {
  tab: ShopTab;
  cart: Row[];
  favs: Row[];
  canCheckout: boolean;
  canView: boolean;
  onTab: (t: ShopTab) => void;
  onClose: () => void;
  onQty: (id: string, qty: number) => void;
  onRemoveCart: (id: string) => void;
  onRemoveFav: (id: string) => void;
  onAddToCart: (id: string) => void;
  onView: (id: string) => void;
  onCheckout: () => void;
};

// Small cart / favourites popover under the header. Reads and writes the shared Redux slices.
export default function ShopPopover(p: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && p.onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

  const rows = p.tab === "cart" ? p.cart : p.favs;
  const subtotal = p.cart.reduce((a, r) => a + r.price * r.qty, 0);

  return (
    <>
      <div
        onClick={p.onClose}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, zIndex: 49 }}
      />
      <div
        role="dialog"
        aria-label={p.tab === "cart" ? "Cart" : "Favourites"}
        className="aq-glass"
        style={{
          position: "absolute",
          top: 62,
          right: 12,
          zIndex: 50,
          width: "min(360px, calc(100% - 24px))",
          maxHeight: "min(560px, calc(100dvh - 90px))",
          display: "flex",
          flexDirection: "column",
          borderRadius: 24,
          background: "rgba(var(--aq-gl),.82)",
          animation: "aqPop .25s cubic-bezier(.22,.8,.24,1) both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 12px 8px",
          }}
        >
          <div
            role="tablist"
            style={{
              display: "flex",
              gap: 4,
              padding: 4,
              borderRadius: 999,
              background: "rgba(var(--aq-ln),.05)",
              flex: 1,
            }}
          >
            {(["cart", "fav"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={p.tab === t}
                onClick={() => p.onTab(t)}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 999,
                  border: 0,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--aq-ink)",
                  background: p.tab === t ? "var(--aq-surf)" : "transparent",
                  boxShadow:
                    p.tab === t ? "0 2px 8px rgba(var(--aq-sh),.1)" : "none",
                }}
              >
                {t === "cart"
                  ? `Cart · ${p.cart.length}`
                  : `Favourites · ${p.favs.length}`}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="aq-icon-btn"
            onClick={p.onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="aq-noscroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {rows.map((r) => (
            <div
              key={r.id}
              className="aq-card"
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: 8,
                borderRadius: 16,
              }}
            >
              <button
                type="button"
                onClick={() => p.onView(r.id)}
                disabled={!p.canView}
                aria-label={`View ${r.title}`}
                style={{
                  width: 52,
                  height: 52,
                  flexShrink: 0,
                  borderRadius: 12,
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  background: r.photo
                    ? `center / cover no-repeat url("${r.photo}")`
                    : "repeating-linear-gradient(135deg, var(--aq-mint) 0 6px, var(--aq-tint) 6px 12px)",
                }}
              />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}
                >
                  {r.title}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {p.tab === "cart" ? (
                    <div className="aq-stepper" style={{ height: 32 }}>
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => p.onQty(r.id, r.qty - 1)}
                        style={{ height: 30 }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: 13 }}>{r.qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => p.onQty(r.id, r.qty + 1)}
                        style={{ height: 30 }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="aq-chip"
                      onClick={() => p.onAddToCart(r.id)}
                    >
                      Add to cart
                    </button>
                  )}
                  <div style={{ flex: 1 }} />
                  <button
                    type="button"
                    className="aq-icon-btn"
                    aria-label={`Remove ${r.title}`}
                    onClick={() =>
                      p.tab === "cart"
                        ? p.onRemoveCart(r.id)
                        : p.onRemoveFav(r.id)
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
                </div>
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  alignSelf: "flex-start",
                  paddingTop: 2,
                }}
              >
                {INR(r.price * r.qty)}
              </span>
            </div>
          ))}
          {!rows.length && (
            <div
              style={{
                padding: "28px 12px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                {p.tab === "cart" ? "Your cart is empty" : "No favourites yet"}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--aq-mut)" }}>
                Ask Aqua for a recommendation and add it from the product card.
              </span>
            </div>
          )}
        </div>

        {p.tab === "cart" && p.cart.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px 14px",
              borderTop: "1px solid rgba(var(--aq-ln),.06)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--aq-mut)",
                  fontWeight: 600,
                }}
              >
                Subtotal (before server quote)
              </span>
              <span style={{ fontSize: 19, fontWeight: 800 }}>
                {INR(subtotal)}
              </span>
            </div>
            <button
              type="button"
              className="aq-btn aq-btn-primary"
              onClick={p.onCheckout}
              disabled={!p.canCheckout}
              title={
                p.canCheckout ? undefined : "Finish the current step first"
              }
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
