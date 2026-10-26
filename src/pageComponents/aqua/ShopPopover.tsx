"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowRight,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import ArrowScroller from "./ArrowScroller";
import { INR } from "./catalogue";
import { useIsMobile, useIsTouch } from "./hooks";

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
  // Close and put the cursor in the chat (empty states: "ask Aqua").
  onChat?: () => void;
  onQty: (id: string, qty: number) => void;
  onRemoveCart: (id: string) => void;
  onRemoveFav: (id: string) => void;
  onAddToCart: (id: string) => void;
  onView: (id: string) => void;
  onCheckout: () => void;
};

// Pull the sheet down this far (px) to close it.
const DRAG_CLOSE = 90;

// Cart / favourites. Desktop: a popover under the header. Phones, iPads and
// other touch screens: a bottom sheet over a dimmed chat, with room to scroll,
// 44px targets and checkout kept in reach. Reads and writes the shared Redux
// slices through the props.
export default function ShopPopover(p: Props) {
  const narrow = useIsMobile(1100);
  const touch = useIsTouch();
  const layout = narrow || touch ? "sheet" : "popover";

  const { onClose } = p;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus moves into the dialog so keyboard and screen-reader users land here.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  // Sheet: drag the handle down to close.
  const drag = useRef<{ y: number; id: number } | null>(null);
  const [dy, setDy] = useState(0);
  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    drag.current = { y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (d && d.id === e.pointerId) setDy(Math.max(0, e.clientY - d.y));
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (dy > DRAG_CLOSE) onClose();
    setDy(0);
  };

  const isCart = p.tab === "cart";
  const rows = isCart ? p.cart : p.favs;
  const units = p.cart.reduce((a, r) => a + r.qty, 0);
  const subtotal = p.cart.reduce((a, r) => a + r.price * r.qty, 0);

  return (
    <>
      <div
        className="aq-shop-scrim"
        data-layout={layout}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal={layout === "sheet" || undefined}
        aria-label={isCart ? "Cart" : "Favourites"}
        tabIndex={-1}
        className="aq-glass aq-shop"
        data-layout={layout}
        data-dragging={dy > 0}
        style={dy ? { transform: `translateY(${dy}px)` } : undefined}
      >
        {layout === "sheet" && (
          <button
            type="button"
            className="aq-shop-handle"
            aria-label="Close (or drag down)"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => {
              drag.current = null;
              setDy(0);
            }}
            onClick={() => dy === 0 && onClose()}
          >
            <span />
          </button>
        )}

        <div className="aq-shop-head">
          <div role="tablist" aria-label="Shop" className="aq-shop-tabs">
            {(["cart", "fav"] as const).map((t) => {
              const n = t === "cart" ? p.cart.length : p.favs.length;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={p.tab === t}
                  onClick={() => p.onTab(t)}
                  className="aq-shop-tab"
                >
                  {t === "cart" ? (
                    <ShoppingCart size={15} aria-hidden="true" />
                  ) : (
                    <Heart size={15} aria-hidden="true" />
                  )}
                  {t === "cart" ? "Cart" : "Favourites"}
                  {n > 0 && <span className="aq-shop-count">{n}</span>}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="aq-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {rows.length ? (
          <ArrowScroller
            wrapClassName="aq-shop-scroll"
            className="aq-shop-list"
            label={isCart ? "cart" : "favourites"}
            resetKey={p.tab}
          >
            {rows.map((r) => (
              <div key={r.id} className="aq-shop-row">
                <button
                  type="button"
                  className="aq-shop-thumb"
                  onClick={() => p.onView(r.id)}
                  disabled={!p.canView}
                  aria-label={`View ${r.title}`}
                  style={
                    r.photo
                      ? { backgroundImage: `url("${r.photo}")` }
                      : undefined
                  }
                />
                <div className="aq-shop-info">
                  <span className="aq-shop-title">{r.title}</span>
                  {/* Favourites: the price. Cart: the unit price, only when it
                      differs from the line total beside it. */}
                  {(!isCart || r.qty > 1) && (
                    <span className="aq-shop-unit">
                      {INR(r.price)}
                      {isCart ? " each" : ""}
                    </span>
                  )}
                  <div className="aq-shop-actions">
                    {isCart ? (
                      <div className="aq-stepper aq-shop-stepper">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${r.title}`}
                          onClick={() => p.onQty(r.id, r.qty - 1)}
                          disabled={r.qty <= 1}
                        >
                          <Minus size={15} />
                        </button>
                        <span aria-live="polite">{r.qty}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${r.title}`}
                          onClick={() => p.onQty(r.id, r.qty + 1)}
                          disabled={r.qty >= 10}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="aq-btn aq-shop-add"
                        onClick={() => p.onAddToCart(r.id)}
                      >
                        <ShoppingCart size={14} aria-hidden="true" />
                        Add to cart
                      </button>
                    )}
                    <button
                      type="button"
                      className="aq-shop-remove"
                      aria-label={`Remove ${r.title}`}
                      onClick={() =>
                        isCart ? p.onRemoveCart(r.id) : p.onRemoveFav(r.id)
                      }
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {isCart && (
                  <span className="aq-shop-total">{INR(r.price * r.qty)}</span>
                )}
              </div>
            ))}
          </ArrowScroller>
        ) : (
          <div className="aq-shop-empty">
            <span className="aq-shop-empty-icon" aria-hidden="true">
              {isCart ? <ShoppingCart size={22} /> : <Heart size={22} />}
            </span>
            <b>{isCart ? "Your cart is empty" : "No favourites yet"}</b>
            <span>
              {isCart
                ? "Tell Aqua about your water and home. It'll pick the right product for you."
                : "Tap the heart on any product to keep it here for later."}
            </span>
            {p.onChat && (
              <button
                type="button"
                className="aq-btn aq-btn-primary aq-shop-ask"
                onClick={p.onChat}
              >
                <MessageCircle size={16} aria-hidden="true" />
                Ask Aqua for a pick
              </button>
            )}
          </div>
        )}

        {isCart && p.cart.length > 0 && (
          <div className="aq-shop-foot">
            <div className="aq-shop-sum">
              <span>
                Subtotal · {units} {units === 1 ? "item" : "items"}
              </span>
              <b>{INR(subtotal)}</b>
              <small>Delivery &amp; coupons at checkout</small>
            </div>
            <button
              type="button"
              className="aq-btn aq-btn-primary aq-shop-checkout"
              onClick={p.onCheckout}
              disabled={!p.canCheckout}
              title={
                p.canCheckout ? undefined : "Finish the current step first"
              }
            >
              Checkout <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
