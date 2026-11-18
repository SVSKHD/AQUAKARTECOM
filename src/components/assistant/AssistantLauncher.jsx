import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

// Rotating prompts on the launcher; the first one explains the gesture.
export const LAUNCHER_HINTS = [
  "Slide to ask",
  "Hard water? Ask Aqua",
  "Find your softener",
];
const HINT_MS = 3600;
const NUDGE_MS = 6500;
// Phones: show the slider for a moment, then shrink to the round avatar.
const COMPACT_AFTER_MS = 7000;
// Share of the track the knob must pass to open on release.
const OPEN_AT = 0.6;

const isPhone = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(max-width: 639px)").matches;

// "Slide to ask": drag the Aqua knob along the pill to open the assistant. A
// tap or Enter opens it too, so the gesture is never required.
const AssistantLauncher = forwardRef(function AssistantLauncher(
  { avatar, onOpen, reduceMotion, panelId },
  ref,
) {
  const x = useMotionValue(0);
  const labelRef = useRef(null);
  const dragged = useRef(false);
  const dragging = useRef(false);
  const [travel, setTravel] = useState(0);
  const [hint, setHint] = useState(0);
  const [compact, setCompact] = useState(false);
  const [opening, setOpening] = useState(false);

  const fill = useTransform(x, (v) => v + 40);
  const labelOpacity = useTransform(x, (v) =>
    travel ? Math.max(0, 1 - (v / travel) * 1.4) : 1,
  );

  // How far the knob can travel: the width of the label beside it.
  useEffect(() => {
    const el = labelRef.current;
    if (!el) return undefined;
    const measure = () => setTravel(el.offsetWidth + 8);
    measure();
    if (typeof ResizeObserver !== "function") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const t = setInterval(
      () => setHint((n) => (n + 1) % LAUNCHER_HINTS.length),
      HINT_MS,
    );
    return () => clearInterval(t);
  }, [reduceMotion]);

  useEffect(() => {
    if (!isPhone()) return undefined;
    const t = setTimeout(() => setCompact(true), COMPACT_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  // An occasional nudge to the right shows that the knob slides.
  useEffect(() => {
    if (reduceMotion || compact || !travel) return undefined;
    const t = setInterval(() => {
      if (dragging.current) return;
      animate(x, [0, Math.min(22, travel * 0.18), 0], {
        duration: 0.9,
        ease: "easeInOut",
      });
    }, NUDGE_MS);
    return () => clearInterval(t);
  }, [reduceMotion, compact, travel, x]);

  const open = useCallback(() => {
    setOpening(true);
    onOpen();
  }, [onOpen]);

  // The slide: pointer capture on the knob, clamped to the track. A press
  // that moves less than a few pixels stays a tap.
  const drag = useRef(null);
  const onPointerDown = (e) => {
    if (compact || !travel || e.button > 0) return;
    drag.current = { startX: e.clientX, from: x.get(), moved: false };
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < 4) return;
    d.moved = true;
    dragged.current = true;
    x.set(Math.min(travel, Math.max(0, d.from + dx)));
  };
  const onPointerEnd = () => {
    const d = drag.current;
    drag.current = null;
    dragging.current = false;
    if (!d?.moved) return;
    if (x.get() >= travel * OPEN_AT) {
      animate(x, travel, { type: "spring", stiffness: 500, damping: 40 });
      open();
    } else {
      animate(x, 0, { type: "spring", stiffness: 520, damping: 32 });
    }
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={() => {
        // The click that ends a drag is not a tap.
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        open();
      }}
      onMouseEnter={() => setCompact(false)}
      onFocus={() => setCompact(false)}
      aria-label="Open AquaKart assistant"
      aria-haspopup="dialog"
      aria-expanded={false}
      aria-controls={panelId}
      data-compact={compact ? "true" : "false"}
      data-opening={opening ? "true" : "false"}
      initial={reduceMotion ? false : { opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="aq-assist-fab aq-launch group fixed right-4 print:hidden z-[80] inline-flex h-14 items-center rounded-full bg-slate-950 p-2 text-white shadow-[0_18px_45px_rgba(2,6,23,0.35)] ring-1 ring-white/10 transition-colors hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/60 sm:right-6"
    >
      <span className="aq-launch-track">
        <motion.span
          className="aq-launch-fill"
          aria-hidden="true"
          style={{ width: fill }}
        />
        <motion.span
          className="aq-launch-knob"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          style={{ x }}
        >
          <span className="aq-launch-ping" aria-hidden="true" />
          {avatar}
        </motion.span>
        <motion.span
          ref={labelRef}
          className="aq-launch-label"
          aria-hidden="true"
          style={{ opacity: labelOpacity }}
        >
          <span className="aq-launch-hint" data-hint={hint}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={hint}
                className="aq-launch-text"
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {LAUNCHER_HINTS[hint]}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="aq-launch-chevrons">
            <i>›</i>
            <i>›</i>
            <i>›</i>
          </span>
        </motion.span>
      </span>
    </motion.button>
  );
});

export default AssistantLauncher;
