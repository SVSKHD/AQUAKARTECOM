"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeft, ChevronRight, Flame, GripVertical } from "lucide-react";
import { useDemandFeed } from "@/components/demand/useDemandFeed";
import {
  cleanProductName,
  demandHeadings,
  matchProduct,
  recentLine,
  trendingLine,
} from "@/utils/demandFeed";
import { INR } from "./catalogue";
import { storage, useReducedMotion } from "./hooks";
import type { Product } from "./types";

type RecentItem = {
  productName: string;
  productSlug: string | null;
  productId: string | null;
  quantity: number;
  area: string | null;
  purchasedAt: string | null;
};
type TrendingItem = {
  productName: string;
  productSlug: string | null;
  productId: string | null;
  orders: number;
  units: number;
  lastPurchasedAt: string | null;
};
type Pos = { x: number; y: number };
type Side = "left" | "right";
// Where the "Popular" bubble rests: an edge, and its top from the workspace top.
type TabPos = { side: Side; y: number };

const POS_KEY = "aqua.demand.pos";
const TAB_KEY = "aqua.demand.tab";
const TUCKED_KEY = "aqua.demand.tucked";
const ROTATE_MS = 4000;
const EDGE = 8;
const NUDGE = 24;
// Swipe distance (px) that tucks the card away on touch screens.
const SWIPE_TUCK = 80;

// Moved further than this, a press on the bubble is a drag, not a tap.
const TAP_SLOP = 6;

const readTabPos = (): TabPos | null => {
  try {
    const v = JSON.parse(storage.get(TAB_KEY) || "null");
    return v &&
      (v.side === "left" || v.side === "right") &&
      Number.isFinite(v.y)
      ? v
      : null;
  } catch {
    return null;
  }
};

const readPos = (): Pos | null => {
  try {
    const v = JSON.parse(storage.get(POS_KEY) || "null");
    return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? v : null;
  } catch {
    return null;
  }
};

// Floating, glowing "Recently bought / Popular" card over the workspace.
// Desktop: drag it by its grip (or arrow keys); the chevron tucks it into a
// "Popular" bubble on the edge. Phones and iPads (`touch`): docked at the
// bottom on the bubble's side, swipe it toward that edge to tuck it away.
// The bubble works like AssistiveTouch: drag it anywhere, it snaps to the
// nearest side and stays there; tap it to open the card on that side.
// Matched products open in the panel with the catalogue's photo and price
// (the feed has no prices). Renders nothing while loading, empty or failed.
export default function DemandStrip({
  products,
  area,
  onOpen,
  bottomOffset,
  touch,
  autoTuck,
}: {
  products: Map<string, Product>;
  area: string | null;
  onOpen: (id: string) => void;
  // Starts above the composer.
  bottomOffset: number;
  touch: boolean;
  // Tuck it away (without remembering it) once a chat is under way on touch.
  autoTuck: boolean;
}) {
  const { status, result } = useDemandFeed({ area, limit: 8 });
  const reduced = useReducedMotion();
  const list = useMemo(() => [...products.values()], [products]);
  const recent = useMemo(
    () =>
      ((result?.feed?.recent || []) as RecentItem[]).map((item) => ({
        item,
        product: matchProduct(item, list) as Product | null,
      })),
    [result, list],
  );
  const trending = useMemo(
    () =>
      ((result?.feed?.trending || []) as TrendingItem[])
        .map((item) => ({
          item,
          product: matchProduct(item, list) as Product | null,
        }))
        .slice(0, 3),
    [result, list],
  );

  // ---------- tucked into the edge tab ----------
  const [tucked, setTuckedState] = useState(
    () => storage.get(TUCKED_KEY) === "1",
  );
  const setTucked = (on: boolean, remember = true) => {
    setTuckedState(on);
    if (remember) storage.set(TUCKED_KEY, on ? "1" : "0");
  };
  useEffect(() => {
    if (autoTuck) setTuckedState(true);
  }, [autoTuck]);

  // ---------- rotating "recently bought" line ----------
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reduced || paused || tucked || recent.length < 2) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % recent.length),
      ROTATE_MS,
    );
    return () => clearInterval(t);
  }, [reduced, paused, tucked, recent.length]);

  // ---------- desktop: drag by the grip, kept on screen ----------
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<Pos | null>(readPos);
  const drag = useRef<{ dx: number; dy: number; id: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const clamp = useCallback((p: Pos): Pos => {
    const el = ref.current;
    const host = el?.offsetParent as HTMLElement | null;
    if (!el || !host) return p;
    const maxX = host.clientWidth - el.offsetWidth - EDGE;
    const maxY = host.clientHeight - el.offsetHeight - EDGE;
    return {
      x: Math.round(Math.min(Math.max(EDGE, p.x), Math.max(EDGE, maxX))),
      y: Math.round(Math.min(Math.max(EDGE, p.y), Math.max(EDGE, maxY))),
    };
  }, []);
  const hasPos = pos !== null;
  useEffect(() => {
    if (!hasPos || touch) return;
    const fit = () => setPos((p) => (p ? clamp(p) : p));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [hasPos, touch, clamp, tucked]);
  const savePos = (p: Pos) => storage.set(POS_KEY, JSON.stringify(p));
  const current = (): Pos => {
    const el = ref.current;
    return el ? { x: el.offsetLeft, y: el.offsetTop } : { x: EDGE, y: EDGE };
  };
  const onGripDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (touch) return;
    const start = pos || current();
    drag.current = {
      dx: e.clientX - start.x,
      dy: e.clientY - start.y,
      id: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onGripMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setPos(clamp({ x: e.clientX - d.dx, y: e.clientY - d.dy }));
  };
  const onGripUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    setPos((p) => {
      if (p) savePos(p);
      return p;
    });
  };
  const onGripKey = (e: ReactKeyboardEvent) => {
    if (touch) return;
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    };
    const s = step[e.key];
    if (!s) return;
    e.preventDefault();
    const from = pos || current();
    const next = clamp({ x: from.x + s[0], y: from.y + s[1] });
    setPos(next);
    savePos(next);
  };

  // ---------- the "Popular" bubble: drag anywhere, snaps to an edge ----------
  const tabRef = useRef<HTMLButtonElement>(null);
  const [tabPos, setTabPos] = useState<TabPos | null>(readTabPos);
  const side: Side = tabPos?.side ?? "left";
  const toward = side === "left" ? -1 : 1;
  const tabDrag = useRef<{
    id: number;
    x: number;
    y: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);
  // While dragging, the bubble follows the finger freely (left/top in px).
  const [tabFree, setTabFree] = useState<Pos | null>(null);
  const tabJustDragged = useRef(false);
  const tabHost = () => tabRef.current?.offsetParent as HTMLElement | null;
  const clampTabY = useCallback((y: number) => {
    const el = tabRef.current;
    const host = el?.offsetParent as HTMLElement | null;
    if (!el || !host) return y;
    return Math.round(
      Math.min(Math.max(EDGE, y), host.clientHeight - el.offsetHeight - EDGE),
    );
  }, []);
  const saveTab = (t: TabPos) => {
    setTabPos(t);
    storage.set(TAB_KEY, JSON.stringify(t));
  };
  // Keep a saved bubble on screen after a resize or rotation.
  const hasTabPos = tabPos !== null;
  useEffect(() => {
    if (!hasTabPos || !tucked) return;
    const fit = () => setTabPos((t) => (t ? { ...t, y: clampTabY(t.y) } : t));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [hasTabPos, tucked, clampTabY]);
  const onTabDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    tabDrag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      ox: el.offsetLeft,
      oy: el.offsetTop,
      moved: false,
    };
    el.setPointerCapture?.(e.pointerId);
  };
  const onTabMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = tabDrag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
    d.moved = true;
    const host = tabHost();
    const el = tabRef.current;
    const maxX = host && el ? host.clientWidth - el.offsetWidth : Infinity;
    setTabFree({
      x: Math.min(Math.max(0, d.ox + dx), maxX),
      y: clampTabY(d.oy + dy),
    });
  };
  const onTabUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = tabDrag.current;
    tabDrag.current = null;
    if (!d || d.id !== e.pointerId || !d.moved) return;
    // Snap to whichever edge the bubble's centre is nearer.
    const host = tabHost();
    const el = tabRef.current;
    const x = tabFree?.x ?? d.ox;
    const y = tabFree?.y ?? d.oy;
    const mid = x + (el?.offsetWidth || 0) / 2;
    const next: TabPos = {
      side: host && mid > host.clientWidth / 2 ? "right" : "left",
      y: clampTabY(y),
    };
    setTabFree(null);
    saveTab(next);
    tabJustDragged.current = true;
  };
  const onTabClick = () => {
    // The click that ends a drag only moves the bubble.
    if (tabJustDragged.current) {
      tabJustDragged.current = false;
      return;
    }
    setTucked(false);
  };
  // Keyboard: up/down move it along the edge, left/right switch sides.
  const onTabKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    const y = tabPos?.y ?? el.offsetTop;
    const moves: Record<string, () => TabPos> = {
      ArrowUp: () => ({ side, y: clampTabY(y - NUDGE) }),
      ArrowDown: () => ({ side, y: clampTabY(y + NUDGE) }),
      ArrowLeft: () => ({ side: "left", y }),
      ArrowRight: () => ({ side: "right", y }),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    saveTab(move());
  };

  // ---------- touch: swipe the card toward its edge to tuck it away ----------
  // Becomes a swipe only once the finger moves sideways, so taps on the
  // products and vertical scrolling still work.
  const swipe = useRef<{
    x: number;
    y: number;
    id: number;
    t: number;
    active: boolean;
  } | null>(null);
  const [swipeDx, setSwipeDx] = useState(0);
  const swallowClick = useRef(false);
  const onSwipeDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!touch) return;
    swipe.current = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      t: Date.now(),
      active: false,
    };
  };
  const onSwipeMove = (e: ReactPointerEvent<HTMLElement>) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.active) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      s.active = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // Follows the finger toward the bubble's edge; resists the other way.
    setSwipeDx(dx * toward > 0 ? dx : dx / 4);
  };
  const onSwipeEnd = (e: ReactPointerEvent<HTMLElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s?.active) return;
    swallowClick.current = true;
    const dx = e.clientX - s.x;
    const fast = Math.abs(dx) / Math.max(1, Date.now() - s.t) > 0.5;
    setSwipeDx(0);
    const out = dx * toward;
    if (out > SWIPE_TUCK || (out > 40 && fast)) setTucked(true);
  };
  // The tap that ends a swipe shouldn't also open a product.
  const onClickCapture = (e: ReactMouseEvent) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  if (status !== "ready" || !result) return null;
  const headings = demandHeadings(result);
  const now = Date.now();
  const days = result.feed.days;

  if (tucked)
    return (
      <button
        ref={tabRef}
        type="button"
        className="aq-demand-tab"
        data-side={side}
        data-dragging={tabFree !== null}
        style={
          tabFree
            ? { left: tabFree.x, top: tabFree.y }
            : tabPos
              ? { [side]: 0, top: tabPos.y }
              : { left: 0, bottom: bottomOffset + 16 }
        }
        onClick={onTabClick}
        onPointerDown={onTabDown}
        onPointerMove={onTabMove}
        onPointerUp={onTabUp}
        onPointerCancel={onTabUp}
        onKeyDown={onTabKey}
        aria-label={`Show ${headings.recent.toLowerCase()} and ${headings.trending.toLowerCase()}. Drag, or use the arrow keys, to move it`}
        title="Tap to open · drag to move"
      >
        <Flame size={16} aria-hidden="true" />
        <span className="aq-demand-tab-text">Popular</span>
      </button>
    );

  const shown = reduced
    ? recent.slice(0, 2)
    : recent.length
      ? [recent[index % recent.length]]
      : [];
  // Opens on the bubble's side (touch always; desktop until it's dragged).
  const docked = { [side]: 16, bottom: bottomOffset + 16 };
  const place = touch ? docked : pos ? { left: pos.x, top: pos.y } : docked;
  const swipeHint = `Swipe ${side} to tuck away`;

  return (
    <aside
      ref={ref}
      className="aq-glass aq-demand-float"
      aria-label="Recent purchases on Aquakart"
      data-dragging={dragging}
      data-swiping={swipeDx !== 0}
      data-touch={touch}
      style={{
        ...place,
        transform: swipeDx ? `translateX(${swipeDx}px)` : undefined,
        opacity:
          swipeDx * toward > 0
            ? Math.max(0.35, 1 - Math.abs(swipeDx) / 260)
            : undefined,
      }}
      onPointerDown={onSwipeDown}
      onPointerMove={onSwipeMove}
      onPointerUp={onSwipeEnd}
      onPointerCancel={onSwipeEnd}
      onClickCapture={onClickCapture}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="aq-demand-head">
        <button
          type="button"
          className="aq-demand-grip"
          aria-label={
            touch
              ? `Recent purchases. ${swipeHint}`
              : "Move the recent purchases card (drag, or use the arrow keys)"
          }
          title={touch ? swipeHint : "Drag to move"}
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={onGripUp}
          onKeyDown={onGripKey}
        >
          {!touch && <GripVertical size={14} aria-hidden="true" />}
          <span className="aq-demand-live" aria-hidden="true" />
          <span>Live on Aquakart</span>
        </button>
        <button
          type="button"
          className="aq-demand-btn"
          onClick={() => setTucked(true)}
          aria-label="Tuck recent purchases away"
          title="Tuck away"
        >
          {side === "left" ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
      </div>

      {shown.length > 0 && (
        <div className="aq-demand-recent">
          <span className="aq-demand-kicker">{headings.recent}</span>
          {shown.map(({ item, product }, i) => (
            <button
              key={`${index}-${i}`}
              type="button"
              className="aq-demand-line"
              disabled={!product}
              onClick={() => product && onOpen(product.id)}
            >
              <span className="aq-demand-dot" aria-hidden="true" />
              <span className="aq-demand-text">{recentLine(item, now)}</span>
            </button>
          ))}
        </div>
      )}

      {trending.length > 0 && (
        <div className="aq-demand-trending">
          <span className="aq-demand-kicker">
            <Flame size={12} aria-hidden="true" /> {headings.trending}
          </span>
          <ol className="aq-demand-list">
            {trending.map(({ item, product }) => (
              <li key={item.productId || item.productSlug || item.productName}>
                <button
                  type="button"
                  className="aq-demand-row"
                  disabled={!product}
                  onClick={() => product && onOpen(product.id)}
                >
                  <span
                    aria-hidden="true"
                    className="aq-demand-thumb"
                    style={
                      product?.photos[0]
                        ? {
                            background: `var(--aq-surf) center / contain no-repeat url("${product.photos[0]}")`,
                          }
                        : undefined
                    }
                  />
                  <span className="aq-demand-row-body">
                    <span className="aq-demand-row-name">
                      {product?.title || cleanProductName(item.productName)}
                    </span>
                    <span className="aq-demand-row-meta">
                      {trendingLine(item, days)}
                    </span>
                  </span>
                  {product && (
                    <span className="aq-demand-row-price">
                      {INR(product.price)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      {touch && (
        <span className="aq-demand-hint" aria-hidden="true">
          {swipeHint}
        </span>
      )}
    </aside>
  );
}
