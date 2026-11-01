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
import { sheetLanding, useSheetContentDrag } from "./useSheetContentDrag";

// How long the drawer takes to slide away (matches aqDrawerOut / aqSheetOut).
export const DRAWER_OUT_MS = 220;

// A drawer: from the right on wide screens, a bottom sheet on phones. On
// phones a pull down (on the grip, or on content scrolled to its top) drags
// it with the finger and, far or fast enough, puts it away; otherwise it
// springs back. Every way of closing slides it out before `onClose` runs.
export function useDrawer(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const reduced = useReducedMotion();
  const sheet = useIsMobile(768);
  const [leaving, setLeaving] = useState(false);
  const [dragH, setDragH] = useState<number | null>(null);
  const [fullH, setFullH] = useState(0);

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

  const height = () => ref.current?.getBoundingClientRect().height || 1;
  useSheetContentDrag({
    ref,
    enabled: sheet,
    isPeek: () => false,
    fullH: () => fullH || height(),
    onDrag: (h) => {
      // Measured as the drag starts, before the sheet has moved.
      setFullH(h === null ? 0 : fullH || height());
      setDragH(h);
    },
    onSettle: (startH, travel, ms) => {
      setDragH(null);
      setFullH(0);
      if (sheetLanding(startH, travel, ms, startH) === "close") close();
    },
  });

  // While a finger drags it, the sheet slides down rather than shrinking.
  const style: CSSProperties | undefined =
    dragH !== null && fullH
      ? {
          transform: `translateY(${Math.max(0, fullH - dragH)}px)`,
          transition: "none",
        }
      : undefined;

  return { close, leaving, style, sheet };
}
