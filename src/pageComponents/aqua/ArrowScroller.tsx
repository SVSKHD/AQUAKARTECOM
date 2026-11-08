"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";

// A scroll area without a visible scrollbar: arrows page it (up/down, or
// left/right with axis "x") and only show while there is more in that
// direction. Wheel, touch and keyboard focus still scroll it as usual.

const AXES = {
  y: {
    pos: "scrollTop",
    view: "clientHeight",
    size: "scrollHeight",
    by: "top",
    back: { cls: "aq-scroll-up", word: "up", Icon: ChevronUp },
    fwd: { cls: "aq-scroll-down", word: "down", Icon: ChevronDown },
  },
  x: {
    pos: "scrollLeft",
    view: "clientWidth",
    size: "scrollWidth",
    by: "left",
    back: { cls: "aq-scroll-left", word: "left", Icon: ChevronLeft },
    fwd: { cls: "aq-scroll-right", word: "right", Icon: ChevronRight },
  },
} as const;
export default function ArrowScroller({
  children,
  className = "",
  style,
  wrapClassName = "",
  label,
  resetKey,
  axis = "y",
}: {
  children: ReactNode;
  // Classes for the scrolling element itself.
  className?: string;
  style?: CSSProperties;
  // Classes for the positioned wrapper that holds the arrows.
  wrapClassName?: string;
  // What is being scrolled, for the arrow labels ("areas", "profile").
  label: string;
  // Changing this jumps back to the start (e.g. a new tab).
  resetKey?: string;
  axis?: "x" | "y";
}) {
  const a = AXES[axis];
  const ref = useRef<HTMLDivElement>(null);
  // back = there is more above/left, fwd = more below/right.
  const [edges, setEdges] = useState({ back: false, fwd: false });

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    // abs(): scrollLeft is negative in right-to-left layouts.
    const pos = Math.abs(el[a.pos]);
    const back = pos > 2;
    const fwd = pos + el[a.view] < el[a.size] - 2;
    setEdges((e) => (e.back === back && e.fwd === fwd ? e : { back, fwd }));
  };

  // Re-check when the area or its content changes size, or content is added
  // or removed (filters, forms opening, data arriving) — not after every
  // render. Measuring on render could loop: showing an arrow can nudge the
  // layout (scroll padding, snapping), which flips the arrow back, which
  // renders again ("Maximum update depth exceeded"). Checks are batched to
  // one per frame.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const soon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(soon) : null;
    const watch = () => {
      if (!ro) return;
      ro.disconnect();
      ro.observe(el);
      for (const child of Array.from(el.children)) ro.observe(child);
    };
    watch();
    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            watch();
            soon();
          })
        : null;
    mo?.observe(el, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      ro?.disconnect();
      mo?.disconnect();
    };
    // measure only reads the ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ref.current?.scrollTo?.({ [a.by]: 0 });
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    // Read at click time: only the jump needs it, not the render.
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!el) return;
    el.scrollBy?.({
      [a.by]: dir * el[a.view] * 0.8,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <div
      className={`aq-scroll ${wrapClassName}`}
      data-axis={axis}
      data-back={edges.back}
      data-fwd={edges.fwd}
    >
      {edges.back && (
        <button
          type="button"
          className={`aq-scroll-btn ${a.back.cls}`}
          aria-label={`Scroll ${label} ${a.back.word}`}
          onClick={() => page(-1)}
        >
          <a.back.Icon size={22} aria-hidden="true" />
        </button>
      )}
      <div
        ref={ref}
        className={`aq-noscroll ${className}`}
        style={style}
        onScroll={measure}
      >
        {children}
      </div>
      {edges.fwd && (
        <button
          type="button"
          className={`aq-scroll-btn ${a.fwd.cls}`}
          aria-label={`Scroll ${label} ${a.fwd.word}`}
          onClick={() => page(1)}
        >
          <a.fwd.Icon size={22} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
