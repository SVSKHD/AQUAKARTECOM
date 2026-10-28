"use client";

import { Check, Heart, ShoppingCart } from "lucide-react";
import { INR } from "./catalogue";
import { softenerBadges } from "./softenerSizing";
import type { Product } from "./types";

type Props = {
  product: Product;
  reason?: string;
  isFav: boolean;
  inCart: boolean;
  inCompare: boolean;
  selected: boolean;
  delay?: number;
  // Narrow (two to a row on a phone): no reason note, shorter title, actions on two rows.
  compact?: boolean;
  // Replaces ProductCardTwo's router.push(productHref): opening a product is a flow action.
  onOpen: (productId: string) => void;
  onToggleFav: (productId: string) => void;
  onToggleCompare: (productId: string) => void;
  onAddToCart: (productId: string) => void;
};

// "Automatic · Whole home" / "Manual · Per bathroom", so softeners read apart at a glance.
export function SoftenerBadges({ product }: { product: Product }) {
  const badges = softenerBadges(product);
  if (!badges.length) return null;
  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {badges.map((b, i) => (
        <span
          key={b}
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 999,
            ...(i === 0
              ? b === "Automatic"
                ? {
                    background: "#E6F6FF",
                    color: "#0B5C8A",
                    border: "1px solid #BFE3F7",
                  }
                : {
                    background: "#FFF4E5",
                    color: "#8A5A00",
                    border: "1px solid #F2DDB8",
                  }
              : {
                  background: "var(--aq-tint)",
                  color: "var(--aq-body)",
                  border: "1px solid var(--aq-bd)",
                }),
          }}
        >
          {b}
        </span>
      ))}
    </span>
  );
}

export const stockColors = (p: Product) =>
  p.inStock
    ? p.stock === "In stock"
      ? { bg: "rgba(var(--aq-mintrgb),.95)", fg: "var(--aq-mintink)" }
      : { bg: "#FEF3C7", fg: "#8A5A00" }
    : { bg: "#FDECEC", fg: "#8A1F1F" };

export default function ProductCard({
  product: p,
  reason,
  isFav,
  inCart,
  inCompare,
  selected,
  delay = 0,
  compact = false,
  onOpen,
  onToggleFav,
  onToggleCompare,
  onAddToCart,
}: Props) {
  const sc = stockColors(p);
  const spec = [p.capacity, p.warranty && `${p.warranty} warranty`]
    .filter(Boolean)
    .join(" · ");
  return (
    <article
      style={{
        animation: `aqCardIn .55s cubic-bezier(.22,.8,.24,1) ${delay}s both`,
        background: "rgba(var(--aq-gl),.82)",
        border: `1.5px solid ${selected ? "#10BFA4" : "rgba(var(--aq-gl),.95)"}`,
        borderRadius: 22,
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: "0 8px 22px rgba(var(--aq-sh),.06)",
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          aspectRatio: "4 / 3",
          background: "var(--aq-tint)",
        }}
      >
        <button
          type="button"
          onClick={() => onOpen(p.id)}
          aria-label={`View ${p.title}`}
          style={{
            position: "absolute",
            inset: 0,
            border: 0,
            padding: 0,
            cursor: "pointer",
            background: "transparent",
          }}
        >
          {p.photos[0] ? (
            <div
              role="img"
              aria-label={p.title}
              style={{
                width: "100%",
                height: "100%",
                background: `center / cover no-repeat url("${p.photos[0]}")`,
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
                  "repeating-linear-gradient(135deg, var(--aq-mint) 0 10px, var(--aq-tint) 10px 20px)",
                fontSize: 11,
                color: "var(--aq-mut)",
              }}
            >
              product shot
            </div>
          )}
        </button>
        <span
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 9px",
            borderRadius: 999,
            background: sc.bg,
            color: sc.fg,
            pointerEvents: "none",
          }}
        >
          {p.stock}
        </span>
        <button
          type="button"
          className="aq-icon-btn"
          onClick={() => onToggleFav(p.id)}
          aria-label={
            isFav
              ? `Remove ${p.title} from favourites`
              : `Save ${p.title} to favourites`
          }
          aria-pressed={isFav}
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            color: isFav ? "#E0476B" : "var(--aq-ink)",
          }}
        >
          <Heart size={15} fill={isFav ? "#E0476B" : "none"} />
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "0 6px",
        }}
      >
        <span className="aq-label">{p.brand}</span>
        {/* Two lines tall whatever the title, so cards in a row line up. */}
        <span
          title={p.title}
          style={{
            fontSize: compact ? 13.5 : 15,
            fontWeight: 700,
            lineHeight: 1.3,
            minHeight: "2.6em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {p.title}
        </span>
        {/* One badge tall even for products without badges. */}
        <div style={{ minHeight: 22 }}>
          <SoftenerBadges product={p} />
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            columnGap: 8,
          }}
        >
          <span
            className="aq-display"
            style={{ fontSize: compact ? 16 : 18, fontWeight: 700 }}
          >
            {INR(p.price)}
          </span>
          {p.mrp > p.price && (
            <span
              style={{
                fontSize: 12,
                color: "var(--aq-mut2)",
                textDecoration: "line-through",
              }}
            >
              {INR(p.mrp)}
            </span>
          )}
        </div>
        {/* Kept even when empty: the line holds its place. */}
        <span
          aria-hidden={!spec}
          style={{ fontSize: 12, color: "var(--aq-mut)", minHeight: "1.4em" }}
        >
          {spec}
        </span>
        {reason && !compact && (
          <div
            style={{
              background: "rgba(var(--aq-mintrgb),.95)",
              color: "var(--aq-mintink2)",
              fontSize: 12,
              lineHeight: 1.45,
              padding: "8px 10px",
              borderRadius: 12,
              fontWeight: 500,
            }}
          >
            {reason}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: compact ? "wrap" : undefined,
          gap: 6,
          padding: "0 4px 4px",
          // Pinned to the bottom: every card's buttons sit on one line.
          marginTop: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => onToggleCompare(p.id)}
          aria-pressed={inCompare}
          className="aq-btn"
          style={{
            flex: compact ? "1 1 0" : 1,
            minWidth: 0,
            height: 36,
            padding: compact ? "0 6px" : "0 10px",
            fontSize: 12.5,
            border: `1px solid ${inCompare ? "#10BFA4" : "var(--aq-bd)"}`,
            background: inCompare ? "var(--aq-mint)" : "var(--aq-surf)",
            color: inCompare ? "var(--aq-mintink)" : "var(--aq-ink)",
          }}
        >
          {inCompare ? "Comparing" : "Compare"}
        </button>
        <button
          type="button"
          className="aq-icon-btn"
          onClick={() => onAddToCart(p.id)}
          disabled={!p.inStock}
          aria-label={
            inCart
              ? `${p.title} is in your cart, add one more`
              : `Add ${p.title} to cart`
          }
          style={{
            width: 36,
            height: 36,
            color: inCart ? "#008B68" : "var(--aq-ink)",
          }}
        >
          {inCart ? <Check size={16} /> : <ShoppingCart size={15} />}
        </button>
        <button
          type="button"
          className="aq-btn aq-btn-dark"
          onClick={() => onOpen(p.id)}
          style={{
            flex: compact ? "1 0 100%" : 1.3,
            order: compact ? 3 : undefined,
            height: 36,
            padding: "0 10px",
            fontSize: 12.5,
          }}
        >
          View
        </button>
      </div>
    </article>
  );
}
