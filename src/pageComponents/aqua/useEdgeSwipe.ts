"use client";

import { useEffect, useRef, useState } from "react";

// Phones: a finger dragged right from the sidebar's grip pulls the sidebar
// out with it; a finger dragged left on the open sidebar pushes it away. It
// only becomes a swipe once the finger clearly moves sideways, so scrolling
// and taps are left alone.
//
// Not from the bare screen edge: there the browser's own back swipe (Safari,
// Android's back gesture) wins and leaves the page. The grip sits inset,
// clear of that zone, and is the only place an opening drag starts.
// Nothing carries it at the moment: on touch the sidebar opens from the
// header's clock or the hot-picks bubble when it shows the clock (DemandStrip).
export const GRAB_SELECTOR = "[data-dock-grab]";
// Movement before deciding whether it's a sideways swipe or a scroll.
const DECIDE_PX = 10;
// Released past this share of the way, or faster than this, it completes.
const COMMIT_SHARE = 0.35;
const FLICK_PX_PER_MS = 0.45;

// The sidebar's travel: from fully hidden (-travel) to open (0).
export const sidebarTravel = (viewport: number) =>
  Math.min(320, viewport - 16) + 24;

// Where the sidebar sits for a drag of dx (px) that started open or closed.
export const dragOffset = (
  mode: "open" | "close",
  dx: number,
  travel: number,
) =>
  mode === "open"
    ? Math.min(0, Math.max(-travel, -travel + dx))
    : Math.min(0, Math.max(-travel, dx));

// On release: does the sidebar end up open?
export const settleOpen = (
  mode: "open" | "close",
  offset: number,
  travel: number,
  velocity: number,
) =>
  mode === "open"
    ? velocity > FLICK_PX_PER_MS ||
      (velocity > -FLICK_PX_PER_MS && offset > -travel * (1 - COMMIT_SHARE))
    : !(
        velocity < -FLICK_PX_PER_MS ||
        (velocity < FLICK_PX_PER_MS && offset < -travel * COMMIT_SHARE)
      );

type Track = {
  mode: "open" | "close";
  x0: number;
  y0: number;
  t: number;
  lastX: number;
  lastT: number;
  axis: "x" | "y" | null;
  travel: number;
};

// The sidebar's translateX (px) while a finger drags it, else null.
export function useEdgeSwipe({
  enabled,
  open,
  onOpen,
  onClose,
}: {
  enabled: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const state = useRef({ open, onOpen, onClose });
  useEffect(() => {
    state.current = { open, onOpen, onClose };
  });

  useEffect(() => {
    if (!enabled) return;
    let track: Track | null = null;

    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const isOpen = state.current.open;
      // Opening only from the grip; closing from anywhere.
      const target = e.target as Element | null;
      if (!isOpen && !target?.closest?.(GRAB_SELECTOR)) return;
      track = {
        mode: isOpen ? "close" : "open",
        x0: t.clientX,
        y0: t.clientY,
        t: e.timeStamp,
        lastX: t.clientX,
        lastT: e.timeStamp,
        axis: null,
        travel: sidebarTravel(window.innerWidth),
      };
    };

    const move = (e: TouchEvent) => {
      if (!track) return;
      const t = e.touches[0];
      const dx = t.clientX - track.x0;
      const dy = t.clientY - track.y0;
      if (!track.axis) {
        if (Math.abs(dx) < DECIDE_PX && Math.abs(dy) < DECIDE_PX) return;
        track.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
        // A scroll: let the page have it.
        if (track.axis === "y") {
          track = null;
          return;
        }
      }
      // Ours now: no page scroll or browser back-swipe under the finger.
      if (e.cancelable) e.preventDefault();
      track.lastX = t.clientX;
      track.lastT = e.timeStamp;
      setDrag(dragOffset(track.mode, dx, track.travel));
    };

    const end = (e: TouchEvent) => {
      const tr = track;
      track = null;
      if (!tr || tr.axis !== "x") return;
      const t = e.changedTouches[0];
      const dx = (t?.clientX ?? tr.lastX) - tr.x0;
      const dt = Math.max(1, e.timeStamp - tr.t);
      const offset = dragOffset(tr.mode, dx, tr.travel);
      const opened = settleOpen(tr.mode, offset, tr.travel, dx / dt);
      setDrag(null);
      if (opened && !state.current.open) state.current.onOpen();
      if (!opened && state.current.open) state.current.onClose();
    };

    const cancel = () => {
      track = null;
      setDrag(null);
    };

    window.addEventListener("touchstart", start, { passive: true });
    // Not passive: a sideways swipe stops the page from scrolling.
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", cancel);
      setDrag(null);
    };
  }, [enabled]);

  return drag;
}
