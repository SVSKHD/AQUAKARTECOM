"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronRight,
  GitCompareArrows,
  Heart,
  ShoppingCart,
  X,
} from "lucide-react";
import { INR } from "./catalogue";
import { RatingLine } from "./ShopPanel";
import type { Product } from "./types";
import { useDrawer } from "./useDrawer";

type Props = {
  products: Product[];
  favIds: string[];
  cartIds: string[];
  compare: string[];
  canView: boolean;
  onView: (id: string) => void;
  onToggleFav: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onAddToCart: (id: string) => void;
  // Compare the picked products (the same as the chat's Compare button).
  onCompare: () => void;
  onClose: () => void;
};

const off = (p: Product) =>
  p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

// Every product an answer names, in one list: photo, rating, price and
// stock at a glance, with favourite / cart / compare on each row. A row opens
// the product; picks for comparing are the chat's own.
export default function ProductsDrawer(p: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drawer = useDrawer(ref, p.onClose);
  const [cheapest, setCheapest] = useState(false);
  const closeRef = useRef(drawer.close);
  useEffect(() => {
    closeRef.current = drawer.close;
  });

  // Escape puts it away; focus starts on Close.
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({
      preventScroll: true,
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const list = cheapest
    ? [...p.products].sort((a, b) => a.price - b.price)
    : p.products;
  const picked = p.compare.length;
  const n = p.products.length;

  return (
    <>
      <div
        className="aq-drawer-scrim"
        aria-hidden="true"
        data-leaving={drawer.leaving}
        onClick={drawer.close}
      />
      <div className="aq-drawer-layer">
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby="aq-pd-title"
          className="aq-glass aq-drawer aq-pd"
          data-leaving={drawer.leaving}
          style={drawer.style}
        >
          <div className="aq-drawer-grip" aria-hidden="true" />
          <header className="aq-pd-head">
            <h2 id="aq-pd-title" className="aq-display aq-pd-title">
              Products in this answer
            </h2>
            <button
              type="button"
              className="aq-icon-btn"
              onClick={drawer.close}
              aria-label="Close products"
              data-autofocus
            >
              <X size={16} />
            </button>
          </header>
          <div className="aq-pd-bar">
            <span className="aq-pd-sub">
              {n} {n === 1 ? "product" : "products"} · today&apos;s prices
            </span>
            {n > 1 && (
              <button
                type="button"
                className="aq-pd-sort"
                aria-pressed={cheapest}
                onClick={() => setCheapest((c) => !c)}
                title={cheapest ? "Back to answer order" : "Lowest price first"}
              >
                <ArrowUpDown size={14} aria-hidden="true" />
                {cheapest ? "Lowest price" : "As mentioned"}
              </button>
            )}
          </div>

          <ul className="aq-pd-list" aria-label="Products">
            {list.map((v, i) => {
              const fav = p.favIds.includes(v.id);
              const inCart = p.cartIds.includes(v.id);
              const comparing = p.compare.includes(v.id);
              const pct = off(v);
              return (
                <li
                  key={v.id}
                  className="aq-pd-row"
                  style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
                >
                  <button
                    type="button"
                    className="aq-pd-open"
                    disabled={!p.canView}
                    onClick={() => p.onView(v.id)}
                    aria-label={`Open ${v.title}`}
                  >
                    <span
                      aria-hidden="true"
                      className="aq-pd-img"
                      style={{
                        background: v.photos[0]
                          ? `center / contain no-repeat url("${v.photos[0]}"), #fff`
                          : "repeating-linear-gradient(135deg, var(--aq-mint) 0 6px, var(--aq-tint) 6px 12px)",
                      }}
                    />
                    <span className="aq-pd-info">
                      <span className="aq-pd-name">{v.title}</span>
                      <RatingLine p={v} />
                      <span className="aq-pd-price">
                        <b>{INR(v.price)}</b>
                        {pct > 0 && (
                          <>
                            <s>{INR(v.mrp)}</s>
                            <em>{pct}% off</em>
                          </>
                        )}
                      </span>
                      <span className="aq-pd-stock" data-in={v.inStock}>
                        {v.stock}
                      </span>
                    </span>
                    <ChevronRight
                      size={18}
                      className="aq-pd-chev"
                      aria-hidden="true"
                    />
                  </button>
                  <div className="aq-pd-tools">
                    <button
                      type="button"
                      className="aq-pd-tool"
                      data-on={comparing}
                      aria-pressed={comparing}
                      onClick={() => p.onToggleCompare(v.id)}
                      aria-label={
                        comparing
                          ? `Remove ${v.title} from compare`
                          : `Compare ${v.title}`
                      }
                      title={comparing ? "In compare" : "Compare"}
                    >
                      <GitCompareArrows size={16} />
                    </button>
                    <button
                      type="button"
                      className="aq-pd-tool"
                      data-on={fav}
                      data-kind="fav"
                      aria-pressed={fav}
                      onClick={() => p.onToggleFav(v.id)}
                      aria-label={
                        fav
                          ? `Remove ${v.title} from favourites`
                          : `Save ${v.title} to favourites`
                      }
                      title={fav ? "In favourites" : "Save"}
                    >
                      <Heart size={16} fill={fav ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      className="aq-pd-tool"
                      data-on={inCart}
                      disabled={inCart || !v.inStock}
                      onClick={() => p.onAddToCart(v.id)}
                      aria-label={
                        inCart
                          ? `${v.title} is in your cart`
                          : `Add ${v.title} to cart`
                      }
                      title={inCart ? "In cart" : "Add to cart"}
                    >
                      {inCart ? (
                        <Check size={16} />
                      ) : (
                        <ShoppingCart size={16} />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {picked > 0 && (
            <footer className="aq-pd-foot">
              <span>
                {picked === 1
                  ? "1 picked · pick one more to compare"
                  : `${picked} picked to compare`}
              </span>
              <button
                type="button"
                className="aq-btn aq-btn-primary"
                disabled={picked < 2}
                onClick={p.onCompare}
              >
                <GitCompareArrows size={15} aria-hidden="true" />
                Compare
              </button>
            </footer>
          )}
        </div>
      </div>
    </>
  );
}
