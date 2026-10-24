"use client";

import { Check, Heart, ShoppingCart } from "lucide-react";
import { inline } from "./AquaReply";
import { INR } from "./catalogue";
import { SoftenerBadges, stockColors } from "./ProductCard";
import type { Product } from "./types";

type Props = {
  product: Product;
  index: number;
  summary: string;
  points: string[];
  // Local fit reason, shown when Aqua's write-up is only the product name.
  reason?: string;
  isFav: boolean;
  inCart: boolean;
  inCompare: boolean;
  selected: boolean;
  delay?: number;
  onOpen: (productId: string) => void;
  onToggleFav: (productId: string) => void;
  onToggleCompare: (productId: string) => void;
  onAddToCart: (productId: string) => void;
};

// What Aqua wrote about one product, laid out on that product: photo, price and
// key specs beside the summary and points, with the card's actions underneath.
export default function ProductInsight({
  product: p,
  index,
  summary,
  points,
  reason,
  isFav,
  inCart,
  inCompare,
  selected,
  delay = 0,
  onOpen,
  onToggleFav,
  onToggleCompare,
  onAddToCart,
}: Props) {
  const sc = stockColors(p);
  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const specs = [
    p.capacity,
    p.flow,
    p.maxPeople && `Up to ${p.maxPeople} people`,
    p.maxPpm && `Up to ${p.maxPpm} ppm`,
    p.warranty && `${p.warranty} warranty`,
  ].filter((s): s is string => !!s);
  const about = summary || (!points.length ? reason : "");
  const key = `pi-${p.id}`;

  return (
    <article
      aria-label={p.title}
      style={{
        width: "100%",
        animation: `aqCardIn .55s cubic-bezier(.22,.8,.24,1) ${delay}s both`,
        background: "rgba(var(--aq-gl),.86)",
        border: `1.5px solid ${selected ? "#10BFA4" : "rgba(var(--aq-gl),.95)"}`,
        borderRadius: 22,
        padding: 10,
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        boxShadow: "0 8px 22px rgba(var(--aq-sh),.06)",
      }}
    >
      <div
        style={{
          position: "relative",
          flex: "1 1 150px",
          minHeight: 150,
          borderRadius: 16,
          overflow: "hidden",
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
            background: p.photos[0]
              ? `center / cover no-repeat url("${p.photos[0]}")`
              : "repeating-linear-gradient(135deg, var(--aq-mint) 0 10px, var(--aq-tint) 10px 20px)",
          }}
        />
        <span
          aria-hidden="true"
          className="aq-display"
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            width: 24,
            height: 24,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 800,
            background: "#071A25",
            color: "#fff",
            pointerEvents: "none",
          }}
        >
          {index}
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
          flex: "999 1 260px",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "2px 4px 2px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span className="aq-label">{p.brand}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 999,
              background: sc.bg,
              color: sc.fg,
            }}
          >
            {p.stock}
          </span>
          <SoftenerBadges product={p} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "4px 12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => onOpen(p.id)}
            style={{
              border: 0,
              padding: 0,
              background: "transparent",
              color: "var(--aq-ink)",
              cursor: "pointer",
              textAlign: "left",
              font: "inherit",
              fontSize: 16.5,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {p.title}
          </button>
          <span
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <span
              className="aq-display"
              style={{ fontSize: 18, fontWeight: 700 }}
            >
              {INR(p.price)}
            </span>
            {off > 0 && (
              <>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--aq-mut2)",
                    textDecoration: "line-through",
                  }}
                >
                  {INR(p.mrp)}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "var(--aq-mintink)",
                  }}
                >
                  {off}% off
                </span>
              </>
            )}
          </span>
        </div>

        {specs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {specs.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: "var(--aq-tint)",
                  border: "1px solid var(--aq-bd)",
                  color: "var(--aq-body)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {about && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--aq-body)",
              textWrap: "pretty",
              overflowWrap: "anywhere",
            }}
          >
            {inline(about, `${key}-s`)}
          </p>
        )}

        {points.length > 0 && (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {points.map((pt, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  color: "var(--aq-body)",
                  overflowWrap: "anywhere",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    marginTop: 2,
                    width: 17,
                    height: 17,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--aq-mint)",
                    color: "var(--aq-mintink)",
                  }}
                >
                  <Check size={11} strokeWidth={3} />
                </span>
                <span>{inline(pt, `${key}-${i}`)}</span>
              </li>
            ))}
          </ul>
        )}

        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: "auto",
            paddingTop: 4,
          }}
        >
          <button
            type="button"
            onClick={() => onToggleCompare(p.id)}
            aria-pressed={inCompare}
            className="aq-btn"
            style={{
              flex: 1,
              maxWidth: 140,
              height: 36,
              padding: "0 12px",
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
              flex: 1,
              maxWidth: 160,
              height: 36,
              padding: "0 12px",
              fontSize: 12.5,
            }}
          >
            View details
          </button>
        </div>
      </div>
    </article>
  );
}
