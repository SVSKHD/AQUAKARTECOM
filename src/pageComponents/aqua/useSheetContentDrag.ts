"use client";

import { useEffect, useRef, type RefObject } from "react";

// A bottom sheet dragged by its content, not only its handle, like a native
// sheet: pulling down on content that's scrolled to its top moves the sheet
// (a scroll that reaches the top mid-gesture hands over to the sheet without
// lifting the finger). Collapsed to peek, any vertical drag moves it.
// Sideways swipes (card rows, the comparison table) are left alone.

// Movement before deciding whether the gesture is vertical or sideways.
const DECIDE_PX = 8;
// A release this close to where the sheet started following is a nudge.
const NUDGE_PX = 6;

// The nearest scrollable box between `node` and the sheet itself.
export const scrollerOf = (node: EventTarget | null, sheet: Element) => {
  for (
    let n = node instanceof Element ? node : null;
    n && n !== sheet;
    n = n.parentElement
  ) {
    if (!(n instanceof HTMLElement)) continue;
    const oy = getComputedStyle(n).overflowY;
    if (
      (oy === "auto" || oy === "scroll") &&
      n.scrollHeight > n.clientHeight + 1
    )
      return n;
  }
  return null;
};

type Options = {
  ref: RefObject<HTMLElement | null>;
  enabled: boolean;
  // The sheet is collapsed: any vertical drag moves it.
  isPeek: () => boolean;
  // Tallest the sheet may be dragged to.
  fullH: () => number;
  // The sheet's height while a finger drags it; null puts it back.
  onDrag: (height: number | null) => void;
  // Released: from the starting height, the distance moved (down is
  // positive) and how long it took (ms).
  onSettle: (startH: number, travel: number, ms: number) => void;
};

export function useSheetContentDrag(opts: Options) {
  // Read at event time, so the listeners stay put across renders.
  const live = useRef(opts);
  useEffect(() => {
    live.current = opts;
  });

  const { ref, enabled } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    let g: {
      x0: number;
      y0: number;
      lastY: number;
      // Where the sheet starts following the finger, once it does.
      baseY: number | null;
      baseT: number;
      h: number;
      axis: "x" | "y" | null;
      scroller: HTMLElement | null;
    } | null = null;

    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      // The handle has its own drag.
      if ((e.target as Element | null)?.closest?.(".aq-sheet-handle")) return;
      const t = e.touches[0];
      g = {
        x0: t.clientX,
        y0: t.clientY,
        lastY: t.clientY,
        baseY: null,
        baseT: e.timeStamp,
        h: el.getBoundingClientRect().height,
        axis: null,
        scroller: scrollerOf(e.target, el),
      };
    };

    const move = (e: TouchEvent) => {
      if (!g) return;
      const t = e.touches[0];
      const dx = t.clientX - g.x0;
      const dy = t.clientY - g.y0;
      if (!g.axis) {
        if (Math.abs(dx) < DECIDE_PX && Math.abs(dy) < DECIDE_PX) return;
        g.axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
      }
      if (g.axis === "x") return;
      const down = t.clientY > g.lastY;
      g.lastY = t.clientY;
      if (g.baseY === null) {
        const atTop = !g.scroller || g.scroller.scrollTop <= 0;
        // Pulling down at the top, or any drag while collapsed; otherwise
        // the content scrolls as usual.
        if (!((down && atTop) || live.current.isPeek())) return;
        g.baseY = t.clientY;
        g.baseT = e.timeStamp;
        g.h = el.getBoundingClientRect().height;
      }
      // The sheet follows the finger now: the content mustn't scroll too.
      if (e.cancelable) e.preventDefault();
      const travel = t.clientY - g.baseY;
      live.current.onDrag(
        Math.min(live.current.fullH(), Math.max(80, g.h - travel)),
      );
    };

    const end = (e: TouchEvent) => {
      const gg = g;
      g = null;
      if (!gg || gg.baseY === null) return;
      const y = e.changedTouches[0]?.clientY ?? gg.lastY;
      const travel = y - gg.baseY;
      if (Math.abs(travel) < NUDGE_PX) return live.current.onDrag(null);
      live.current.onSettle(gg.h, travel, e.timeStamp - gg.baseT);
    };

    const cancel = () => {
      if (g?.baseY != null) live.current.onDrag(null);
      g = null;
    };

    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", cancel);
    };
  }, [ref, enabled]);
}
