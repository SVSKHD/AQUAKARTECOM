"use client";

import type { CSSProperties } from "react";
import { BadgePercent, Check, Heart, ShoppingCart } from "lucide-react";
import { INR } from "./catalogue";
import type { CouponPick } from "./coupons";
import type { Product } from "./types";

type Props = {
  product: Product;
  isFav: boolean;
  inCart: boolean;
  canView?: boolean;
  // The coupon that saves the most on it, when known (the history dock shows it).
  deal?: CouponPick | null;
  style?: CSSProperties;
  className?: string;
  onView: (id: string) => void;
  onToggleFav: (id: string) => void;
  onAddToCart: (id: string) => void;
  onUseCoupon?: (code: string) => void;
};

// Small product card: photo, name, price and stock, with favourite / cart over
// the photo. Used by the history dock's Viewed tab and the phone chat's card row.
export default function MiniProductCard({
  product: v,
  isFav: fav,
  inCart,
  canView = true,
  deal,
  style,
  className,
  onView,
  onToggleFav,
  onAddToCart,
  onUseCoupon,
}: Props) {
  return (
    <div
      className={className ? `aq-dock-product ${className}` : "aq-dock-product"}
      style={style}
    >
      <button
        type="button"
        className="aq-dock-product-open"
        disabled={!canView}
        onClick={() => onView(v.id)}
      >
        <span
          aria-hidden="true"
          className="aq-dock-product-img"
          style={{
            background: v.photos[0]
              ? `center / contain no-repeat url("${v.photos[0]}"), #fff`
              : "repeating-linear-gradient(135deg, var(--aq-mint) 0 6px, var(--aq-tint) 6px 12px)",
          }}
        />
        <span className="aq-dock-product-title">{v.title}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{INR(v.price)}</span>
        <span
          style={{
            fontSize: 11,
            color: v.inStock ? "var(--aq-mintink)" : "#B42318",
          }}
        >
          {v.stock}
        </span>
      </button>
      <button
        type="button"
        className="aq-dock-product-act aq-dock-product-fav"
        data-on={fav}
        aria-pressed={fav}
        aria-label={
          fav
            ? `Remove ${v.title} from favourites`
            : `Save ${v.title} to favourites`
        }
        title={fav ? "In favourites" : "Save to favourites"}
        onClick={() => onToggleFav(v.id)}
      >
        <Heart size={13} fill={fav ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        className="aq-dock-product-act aq-dock-product-cart"
        data-on={inCart}
        disabled={!v.inStock}
        aria-label={
          inCart
            ? `${v.title} is in your cart, add one more`
            : `Add ${v.title} to cart`
        }
        title={inCart ? "In your cart" : "Add to cart"}
        onClick={() => onAddToCart(v.id)}
      >
        <ShoppingCart size={13} />
        {inCart && (
          <span className="aq-dock-product-tick" aria-hidden="true">
            <Check size={8} strokeWidth={4} />
          </span>
        )}
      </button>
      {deal && onUseCoupon && (
        <button
          type="button"
          className="aq-dock-coupon"
          title={`${deal.label}. Click to use ${deal.code} at checkout`}
          aria-label={`Use coupon ${deal.code} to save ${INR(deal.save)}`}
          onClick={() => onUseCoupon(deal.code)}
        >
          <BadgePercent size={12} aria-hidden="true" />
          <span className="aq-dock-coupon-text">
            <b>{deal.code}</b>
            <span>Save {INR(deal.save)}</span>
          </span>
        </button>
      )}
    </div>
  );
}
