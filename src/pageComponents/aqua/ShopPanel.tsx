"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type Ref,
} from "react";
import {
  Check,
  Eye,
  GitCompareArrows,
  Heart,
  Search,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { INR } from "./catalogue";
import { productReviews } from "./productReviews";
import type { Category, Product } from "./types";

// The shop artifact, open in the workspace panel: the whole catalogue to
// search, filter and sort. Hovering a card opens a quick look with the
// product's details and reviews; products of one category can be picked and
// compared (the comparison artifact).

export const CATEGORY_LABEL: Record<Category, string> = {
  softener: "Softeners",
  purifier: "Purifiers",
  filter: "Filters",
  commercial: "Commercial",
  other: "Accessories",
};

export type ShopSort =
  "featured" | "price-asc" | "price-desc" | "discount" | "rating";
const SORTS: { id: ShopSort; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "rating", label: "Top rated" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "discount", label: "Biggest discount" },
];

// Filters, order and the products picked to compare. Kept by the workspace,
// so going into a product and back finds the shop as it was left.
export type ShopUi = {
  query: string;
  cat: Category | "all";
  inStock: boolean;
  sort: ShopSort;
  picked: string[];
};
export const EMPTY_SHOP_UI: ShopUi = {
  query: "",
  cat: "all",
  inStock: false,
  sort: "featured",
  picked: [],
};
export const MAX_COMPARE = 4;

const off = (p: Product) =>
  p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

// Search, category and stock filters, then the chosen order.
export function shopList(
  products: Product[],
  o: Pick<ShopUi, "query" | "cat" | "inStock" | "sort">,
) {
  const words = o.query.toLowerCase().split(/\s+/).filter(Boolean);
  const list = products.filter(
    (p) =>
      (o.cat === "all" || p.cat === o.cat) &&
      (!o.inStock || p.inStock) &&
      words.every((w) =>
        `${p.title} ${p.brand} ${CATEGORY_LABEL[p.cat]}`
          .toLowerCase()
          .includes(w),
      ),
  );
  if (o.sort === "featured") return list;
  const rated = (p: Product) => productReviews(p).rating || 0;
  const by: Record<
    Exclude<ShopSort, "featured">,
    (a: Product, b: Product) => number
  > = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    discount: (a, b) => off(b) - off(a),
    rating: (a, b) => rated(b) - rated(a),
  };
  return [...list].sort(by[o.sort]);
}

// Picking a product to compare: one category at a time, up to MAX_COMPARE.
// A product from another category starts a new comparison.
export function pickToCompare(
  picked: string[],
  id: string,
  catOf: (id: string) => Category | undefined,
): { picked: string[]; note: string } {
  if (picked.includes(id))
    return { picked: picked.filter((x) => x !== id), note: "" };
  const cat = catOf(id);
  if (picked.length && catOf(picked[0]) !== cat)
    return {
      picked: [id],
      note: `Now comparing ${cat ? CATEGORY_LABEL[cat].toLowerCase() : "these"}: products are compared within one category.`,
    };
  if (picked.length >= MAX_COMPARE)
    return { picked, note: `Compare up to ${MAX_COMPARE} at a time.` };
  return { picked: [...picked, id], note: "" };
}

// Five stars, filled to the rating (fractions included).
export function Stars({
  rating,
  size = 13,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <span className="aq-stars" style={{ fontSize: size }} aria-hidden="true">
      ★★★★★
      <span style={{ width: `${(rating / 5) * 100}%` }}>★★★★★</span>
    </span>
  );
}

function RatingLine({ p, full }: { p: Product; full?: boolean }) {
  const r = productReviews(p);
  if (!r.rating)
    return (
      <span className="aq-store-rating aq-store-rating-none">
        No reviews yet
      </span>
    );
  const word = r.count === 1 ? "review" : "reviews";
  return (
    <span
      className="aq-store-rating"
      aria-label={`Rated ${r.rating} out of 5 from ${r.count} ${word}`}
    >
      <Stars rating={r.rating} />
      <b>{r.rating.toFixed(1)}</b>
      <span>
        ({r.count}
        {full ? ` ${word}` : ""})
      </span>
    </span>
  );
}

type Props = {
  products: Product[];
  loading: boolean;
  live: boolean;
  favs: string[];
  cart: string[];
  canView: boolean;
  ui: ShopUi;
  onUi: (patch: Partial<ShopUi>) => void;
  onView: (id: string) => void;
  onBuy: (id: string) => void;
  onAddToCart: (id: string) => void;
  onToggleFav: (id: string) => void;
  onCompare: (ids: string[]) => void;
  onAsk: (text: string) => void;
};

type Peek = {
  id: string;
  top: number;
  left: number;
  side: string;
  // The visible part of the shop, which the backdrop covers.
  view: { top: number; height: number };
};
const PEEK_W = 340;

export default function ShopPanel(p: Props) {
  const { query, cat, inStock, sort, picked } = p.ui;
  const byId = useMemo(
    () => new Map(p.products.map((x) => [x.id, x])),
    [p.products],
  );

  // Only the categories the catalogue has, with how many in each.
  const cats = useMemo(() => {
    const n = new Map<Category, number>();
    for (const x of p.products) n.set(x.cat, (n.get(x.cat) || 0) + 1);
    return (Object.keys(CATEGORY_LABEL) as Category[])
      .filter((c) => n.has(c))
      .map((c) => ({ id: c, count: n.get(c)! }));
  }, [p.products]);
  const list = useMemo(
    () => shopList(p.products, { query, cat, inStock, sort }),
    [p.products, query, cat, inStock, sort],
  );
  const filtered = !!query || cat !== "all" || inStock;

  // ---------- compare (one category at a time) ----------
  const [note, setNote] = useState("");
  const pickedProducts = picked
    .map((id) => byId.get(id))
    .filter((x): x is Product => !!x);
  const pickedCat = pickedProducts[0]?.cat;
  const togglePick = (id: string) => {
    const r = pickToCompare(picked, id, (x) => byId.get(x)?.cat);
    setNote(r.note);
    if (r.picked !== picked) p.onUi({ picked: r.picked });
  };
  // With a category open: compare its first few in one go.
  const inCat = cat === "all" ? [] : list.filter((x) => x.cat === cat);
  const compareCategory = () => {
    const ids = inCat.slice(0, MAX_COMPARE).map((x) => x.id);
    p.onUi({ picked: ids });
    setNote("");
    p.onCompare(ids);
  };

  // ---------- quick look on hover ----------
  const boxRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const [peek, setPeek] = useState<Peek | null>(null);
  const openT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clearTimers = () => {
    clearTimeout(openT.current);
    clearTimeout(closeT.current);
  };
  useEffect(() => clearTimers, []);

  // Beside the card where there's room, otherwise over it.
  const place = (id: string, card: HTMLElement) => {
    const box = boxRef.current;
    if (!box) return;
    const c = box.getBoundingClientRect();
    const r = card.getBoundingClientRect();
    const right = c.right - r.right >= PEEK_W + 16;
    const left = r.left - c.left >= PEEK_W + 16;
    setPeek({
      id,
      view: { top: box.scrollTop, height: box.clientHeight },
      side: right ? "right" : left ? "left" : "over",
      top: r.top - c.top + box.scrollTop,
      left: right
        ? r.right - c.left + 10
        : left
          ? r.left - c.left - PEEK_W - 10
          : Math.max(
              8,
              Math.min(
                r.left - c.left + (r.width - PEEK_W) / 2,
                c.width - PEEK_W - 8,
              ),
            ),
    });
  };
  // Only real hover pointers: a tap on a phone opens the product as before.
  const hoverable = () =>
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
  const onCardEnter = (id: string) => (e: ReactMouseEvent<HTMLElement>) => {
    if (!hoverable()) return;
    const card = e.currentTarget;
    clearTimers();
    // Moving between cards with one open swaps quickly.
    openT.current = setTimeout(() => place(id, card), peek ? 90 : 380);
  };
  const scheduleClose = () => {
    clearTimeout(openT.current);
    closeT.current = setTimeout(() => setPeek(null), 180);
  };
  const quickLook = (id: string, card: HTMLElement | null) => {
    clearTimers();
    if (card) place(id, card);
  };

  // Keep the quick look inside the visible part of the panel.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const el = peekRef.current;
    if (!peek || !box || !el) return;
    const min = box.scrollTop + 68;
    const max = box.scrollTop + box.clientHeight - el.offsetHeight - 10;
    const top = Math.max(min, Math.min(peek.top, max));
    if (top !== peek.top) setPeek({ ...peek, top });
  }, [peek]);
  useEffect(() => {
    if (!peek) return;
    const box = boxRef.current;
    const close = () => setPeek(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    box?.addEventListener("scroll", close, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      box?.removeEventListener("scroll", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [peek]);
  const peeked = peek ? byId.get(peek.id) : undefined;

  const reset = () => p.onUi({ query: "", cat: "all", inStock: false });

  return (
    <div className="aq-noscroll aq-store" ref={boxRef}>
      <div className="aq-store-head">
        <div className="aq-store-title">
          <h2 className="aq-display">Shop</h2>
          <span>
            {p.loading
              ? "Loading the catalogue…"
              : `${list.length} of ${p.products.length} products${p.live ? "" : " · demo catalogue"}`}
          </span>
        </div>
        <label className="aq-store-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => p.onUi({ query: e.target.value })}
            placeholder="Search softeners, purifiers, brands…"
            aria-label="Search products"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => p.onUi({ query: "" })}
            >
              <X size={14} />
            </button>
          )}
        </label>
        <div className="aq-store-bar">
          <div
            className="aq-store-cats"
            role="radiogroup"
            aria-label="Category"
          >
            {[{ id: "all" as const, count: p.products.length }, ...cats].map(
              (c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={cat === c.id}
                  className="aq-store-cat"
                  onClick={() => p.onUi({ cat: c.id })}
                >
                  {c.id === "all" ? "All" : CATEGORY_LABEL[c.id]}
                  <span>{c.count}</span>
                </button>
              ),
            )}
          </div>
          <label className="aq-store-stock">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => p.onUi({ inStock: e.target.checked })}
            />
            In stock
          </label>
          <select
            className="aq-store-sort"
            value={sort}
            onChange={(e) => p.onUi({ sort: e.target.value as ShopSort })}
            aria-label="Sort by"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {cat !== "all" && inCat.length > 1 && (
          <button
            type="button"
            className="aq-chip aq-chip-soft aq-store-catcompare"
            onClick={compareCategory}
          >
            <GitCompareArrows size={14} aria-hidden="true" /> Compare{" "}
            {Math.min(inCat.length, MAX_COMPARE)}{" "}
            {CATEGORY_LABEL[cat].toLowerCase()} side by side
          </button>
        )}
      </div>

      {p.loading ? (
        <ul className="aq-store-grid" aria-busy="true" aria-label="Loading">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="aq-store-card aq-store-skel" />
          ))}
        </ul>
      ) : list.length ? (
        // Keyed by the filters, so a new selection cascades in.
        <ul
          key={`${cat}|${sort}|${inStock}`}
          className="aq-store-grid"
          aria-label="Products"
        >
          {list.map((x, i) => {
            const fav = p.favs.includes(x.id);
            const inCart = p.cart.includes(x.id);
            const isPicked = picked.includes(x.id);
            const pct = off(x);
            const spec = [x.capacity, x.flow].filter(Boolean).join(" · ");
            return (
              <li
                key={x.id}
                className="aq-store-card"
                data-picked={isPicked}
                data-peek={peek?.id === x.id}
                style={{ "--i": Math.min(i, 12) } as CSSProperties}
                onMouseEnter={onCardEnter(x.id)}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  className="aq-store-open"
                  disabled={!p.canView}
                  onClick={() => p.onView(x.id)}
                  aria-label={`View ${x.title}`}
                >
                  <span className="aq-store-img" aria-hidden="true">
                    {x.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.photos[0]} alt="" loading="lazy" />
                    )}
                  </span>
                </button>
                {pct > 0 && <span className="aq-store-off">{pct}% off</span>}
                <button
                  type="button"
                  className="aq-store-fav"
                  data-on={fav}
                  aria-pressed={fav}
                  aria-label={
                    fav
                      ? `Remove ${x.title} from favourites`
                      : `Save ${x.title} to favourites`
                  }
                  onClick={() => p.onToggleFav(x.id)}
                >
                  <Heart size={14} fill={fav ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  className="aq-store-peekbtn"
                  aria-label={`Quick look: ${x.title}`}
                  onClick={(e) =>
                    quickLook(x.id, e.currentTarget.closest("li"))
                  }
                >
                  <Eye size={14} aria-hidden="true" /> Quick look
                </button>
                <div className="aq-store-body">
                  <span className="aq-store-brand">
                    {x.brand || CATEGORY_LABEL[x.cat]}
                  </span>
                  <span className="aq-store-name" title={x.title}>
                    {x.title}
                  </span>
                  <RatingLine p={x} />
                  {spec && <span className="aq-store-spec">{spec}</span>}
                  <span className="aq-store-price">
                    <b>{INR(x.price)}</b>
                    {x.mrp > x.price && <s>{INR(x.mrp)}</s>}
                  </span>
                  <span className="aq-store-stockline" data-in={x.inStock}>
                    {x.stock || (x.inStock ? "In stock" : "Out of stock")}
                  </span>
                </div>
                <div className="aq-store-acts">
                  <button
                    type="button"
                    className="aq-store-pick"
                    aria-pressed={isPicked}
                    aria-label={`Compare ${x.title}`}
                    onClick={() => togglePick(x.id)}
                    title={
                      pickedCat && pickedCat !== x.cat
                        ? "Starts a new comparison in this category"
                        : "Compare with others in this category"
                    }
                  >
                    <span className="aq-store-pick-box" aria-hidden="true">
                      {isPicked && <Check size={11} strokeWidth={3.5} />}
                    </span>
                    Compare
                  </button>
                  <button
                    type="button"
                    className="aq-btn aq-btn-glass aq-store-cart"
                    data-on={inCart}
                    disabled={!x.inStock}
                    onClick={() => p.onAddToCart(x.id)}
                    aria-label={
                      inCart
                        ? `${x.title} is in your cart, add one more`
                        : `Add ${x.title} to cart`
                    }
                  >
                    {inCart ? <Check size={15} /> : <ShoppingCart size={15} />}
                  </button>
                  <button
                    type="button"
                    className="aq-btn aq-btn-dark aq-store-buy"
                    disabled={!x.inStock || !p.canView}
                    onClick={() => p.onBuy(x.id)}
                  >
                    Buy now
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="aq-card aq-store-empty">
          <p>No products match{query ? ` “${query}”` : " these filters"}.</p>
          {filtered && (
            <button
              type="button"
              className="aq-btn aq-btn-glass"
              onClick={reset}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        className="aq-chip aq-chip-soft aq-store-ask"
        onClick={() => p.onAsk("Which product suits my home's water?")}
      >
        <Sparkles size={14} aria-hidden="true" /> Not sure? Ask Aqua which one
        suits your home
      </button>

      {/* Backdrop: dims the rest of the shop so the product stands out. It
          lets the pointer through, so another card can still be hovered. */}
      {peeked && peek && (
        <div
          className="aq-store-scrim"
          aria-hidden="true"
          style={{ top: peek.view.top, height: peek.view.height }}
        />
      )}
      {peeked && peek && (
        <QuickLook
          key={peeked.id}
          ref={peekRef}
          product={peeked}
          peek={peek}
          fav={p.favs.includes(peeked.id)}
          inCart={p.cart.includes(peeked.id)}
          picked={picked.includes(peeked.id)}
          canView={p.canView}
          onEnter={clearTimers}
          onLeave={scheduleClose}
          onClose={() => setPeek(null)}
          onView={() => p.onView(peeked.id)}
          onBuy={() => p.onBuy(peeked.id)}
          onAddToCart={() => p.onAddToCart(peeked.id)}
          onToggleFav={() => p.onToggleFav(peeked.id)}
          onPick={() => togglePick(peeked.id)}
        />
      )}

      {/* The products picked to compare, all from one category. */}
      {pickedProducts.length > 0 && (
        <div className="aq-store-tray" role="region" aria-label="Compare tray">
          <div className="aq-store-tray-items">
            {pickedProducts.map((x) => (
              <span key={x.id} className="aq-store-tray-item" title={x.title}>
                <span className="aq-store-tray-img" aria-hidden="true">
                  {x.photos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={x.photos[0]} alt="" />
                  )}
                </span>
                <span className="aq-store-tray-name">{x.title}</span>
                <button
                  type="button"
                  aria-label={`Remove ${x.title} from compare`}
                  onClick={() => togglePick(x.id)}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="aq-store-tray-side">
            <span className="aq-store-tray-text" aria-live="polite">
              {note ||
                (pickedProducts.length < 2
                  ? "Pick one more from the same category"
                  : `${pickedProducts.length} ${pickedCat ? CATEGORY_LABEL[pickedCat].toLowerCase() : "products"} picked`)}
            </span>
            <button
              type="button"
              className="aq-btn aq-btn-ghost"
              onClick={() => {
                setNote("");
                p.onUi({ picked: [] });
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="aq-btn aq-btn-dark"
              disabled={pickedProducts.length < 2}
              onClick={() => p.onCompare(pickedProducts.map((x) => x.id))}
            >
              <GitCompareArrows size={15} aria-hidden="true" /> Compare{" "}
              {pickedProducts.length}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- the quick look dialog ----------

type QuickLookProps = {
  ref: Ref<HTMLDivElement>;
  product: Product;
  peek: Peek;
  fav: boolean;
  inCart: boolean;
  picked: boolean;
  canView: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClose: () => void;
  onView: () => void;
  onBuy: () => void;
  onAddToCart: () => void;
  onToggleFav: () => void;
  onPick: () => void;
};

function QuickLook({
  ref,
  product: x,
  peek,
  fav,
  inCart,
  picked,
  canView,
  onEnter,
  onLeave,
  onClose,
  onView,
  onBuy,
  onAddToCart,
  onToggleFav,
  onPick,
}: QuickLookProps) {
  const r = productReviews(x);
  const pct = off(x);
  const facts = (
    [
      ["Capacity", x.capacity],
      ["Flow", x.flow],
      ["Family size", x.maxPeople ? `Up to ${x.maxPeople} people` : ""],
      ["Hardness", x.maxPpm ? `Up to ${x.maxPpm} ppm` : ""],
      ["Regeneration", x.regen],
      ["Warranty", x.warranty],
      ["Installation", x.install],
    ] as [string, string | undefined][]
  ).filter((f): f is [string, string] => !!f[1]);
  return (
    <div
      ref={ref}
      className="aq-store-peek"
      role="dialog"
      aria-label={`Quick look: ${x.title}`}
      data-side={peek.side}
      style={{
        top: peek.top,
        left: peek.left,
        // Capped by max-width in CSS on a narrow panel.
        width: PEEK_W,
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        className="aq-store-peek-x"
        aria-label="Close quick look"
        onClick={onClose}
      >
        <X size={14} />
      </button>
      <div className="aq-store-peek-top">
        <span className="aq-store-peek-img" aria-hidden="true">
          {x.photos[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={x.photos[0]} alt="" />
          )}
        </span>
        <div className="aq-store-peek-head">
          <span className="aq-store-brand">
            {x.brand} · {CATEGORY_LABEL[x.cat]}
          </span>
          <strong className="aq-store-peek-title">{x.title}</strong>
          <RatingLine p={x} full />
        </div>
      </div>

      <div className="aq-store-peek-price">
        <b>{INR(x.price)}</b>
        {x.mrp > x.price && (
          <>
            <s>{INR(x.mrp)}</s>
            <span className="aq-store-peek-save">
              Save {INR(x.mrp - x.price)} ({pct}%)
            </span>
          </>
        )}
      </div>
      <span className="aq-store-stockline" data-in={x.inStock}>
        {x.stock || (x.inStock ? "In stock" : "Out of stock")}
      </span>

      {x.desc && <p className="aq-store-peek-desc">{x.desc}</p>}

      {facts.length > 0 && (
        <dl className="aq-store-peek-facts">
          {facts.slice(0, 6).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {x.variants && x.variants.length > 1 && (
        <p className="aq-store-peek-variants">
          <span>Options</span> {x.variants.join(" · ")}
        </p>
      )}

      {r.top.length > 0 && (
        <ul className="aq-store-peek-reviews" aria-label="Reviews">
          {r.top.map((q, i) => (
            <li key={i}>
              <span className="aq-store-peek-who">
                <Stars rating={q.rating} size={11} /> {q.name}
              </span>
              <q>{q.comment}</q>
            </li>
          ))}
        </ul>
      )}

      {/* Two rows, so nothing overflows: the small tools, then the two
          main actions at equal width. */}
      <div className="aq-store-peek-acts">
        <div className="aq-store-peek-tools">
          <button
            type="button"
            className="aq-store-pick"
            aria-pressed={picked}
            onClick={onPick}
          >
            <span className="aq-store-pick-box" aria-hidden="true">
              {picked && <Check size={11} strokeWidth={3.5} />}
            </span>
            Compare
          </button>
          <button
            type="button"
            className="aq-icon-btn"
            aria-pressed={fav}
            aria-label={fav ? "Remove from favourites" : "Save to favourites"}
            onClick={onToggleFav}
            style={{ color: fav ? "#E0465E" : undefined }}
          >
            <Heart size={15} fill={fav ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            className="aq-icon-btn"
            disabled={!x.inStock}
            aria-label={inCart ? "In your cart, add one more" : "Add to cart"}
            onClick={onAddToCart}
          >
            {inCart ? <Check size={15} /> : <ShoppingCart size={15} />}
          </button>
        </div>
        <div className="aq-store-peek-ctas">
          <button
            type="button"
            className="aq-btn aq-btn-glass"
            disabled={!canView}
            onClick={onView}
          >
            Details
          </button>
          <button
            type="button"
            className="aq-btn aq-btn-dark"
            disabled={!x.inStock || !canView}
            onClick={onBuy}
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}
