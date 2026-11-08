"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { useIsMobile, useReducedMotion } from "./hooks";
import { useSheetContentDrag } from "./useSheetContentDrag";

// How long the drawer takes to slide away (matches aqDrawerOut / aqSheetOut).
export const DRAWER_OUT_MS = 220;

// A release past this much of the sheet's height (or this many px) closes it…
const CLOSE_FRACTION = 0.25;
const CLOSE_PX = 140;
// …and so does a downward flick this fast (px/ms), however short.
const FLICK = 0.45;

const SPRING = "transform 320ms cubic-bezier(0.22, 0.8, 0.24, 1)";
const AWAY = `transform ${DRAWER_OUT_MS}ms cubic-bezier(0.4, 0, 1, 1)`;

// A drawer: from the right on wide screens, a bottom sheet on phones. On
// phones a pull down (on the grip, the header, or content scrolled to its
// top) drags it with the finger. Released far or fast enough it slides away
// from where the finger left it; otherwise it springs back. The sheet and the
// dimmed backdrop are moved directly (no re-render per frame), so the drag
// tracks the finger smoothly. Every way of closing slides it out first.
export function useDrawer(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const reduced = useReducedMotion();
  const sheet = useIsMobile(768);
  const [leaving, setLeaving] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const closing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduced) return onCloseRef.current();
    setLeaving(true);
    timer.current = setTimeout(() => onCloseRef.current(), DRAWER_OUT_MS);
  }, [reduced]);

  // The backdrop: the scrim beside the drawer's layer.
  const scrim = () =>
    (ref.current?.parentElement?.parentElement?.querySelector(
      ":scope > .aq-drawer-scrim",
    ) as HTMLElement | null) ?? null;

  // Where the finger has the sheet: px below its resting place.
  const place = (y: number, transition: string) => {
    const el = ref.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height || 1;
    el.style.transition = transition;
    el.style.transform = y > 0 ? `translateY(${y}px)` : "";
    const s = scrim();
    if (s) {
      s.style.transition = transition.replace("transform", "opacity");
      s.style.opacity = y > 0 ? String(Math.max(0, 1 - y / h)) : "";
    }
  };

  const fullRef = useRef(0);
  useSheetContentDrag({
    ref,
    enabled: sheet,
    isPeek: () => false,
    fullH: () => fullRef.current || ref.current?.offsetHeight || 1,
    onDrag: (h) => {
      const el = ref.current;
      if (!el) return;
      if (h === null) {
        fullRef.current = 0;
        return place(0, SPRING);
      }
      // Measured as the drag starts, before the sheet has moved.
      if (!fullRef.current) fullRef.current = el.offsetHeight;
      place(Math.max(0, fullRef.current - h), "none");
    },
    onSettle: (startH, travel, _ms, v) => {
      const full = fullRef.current || startH;
      fullRef.current = 0;
      const away =
        travel > 0 &&
        (v > FLICK ||
          (travel > Math.min(CLOSE_PX, full * CLOSE_FRACTION) && v > -0.1));
      if (!away) return place(0, SPRING);
      // Slide away from where the finger let go, then close for real.
      if (closing.current) return;
      closing.current = true;
      place(full + 24, AWAY);
      timer.current = setTimeout(() => onCloseRef.current(), DRAWER_OUT_MS);
    },
  });

  // Kept for callers; the drag no longer needs React to restyle the sheet.
  const style: CSSProperties | undefined = undefined;
  return { close, leaving, style, sheet };
}
