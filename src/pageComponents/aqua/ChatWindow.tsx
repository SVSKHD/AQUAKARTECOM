"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  GripHorizontal,
  Maximize2,
  Minus,
  PanelLeft,
  PictureInPicture2,
} from "lucide-react";
import AquaAvatar from "./AquaAvatar";
import { storage } from "./hooks";

const POS_KEY = "aqua.chatwin.pos";
const MIN_KEY = "aqua.chatwin.min";
const W = 420;
const EDGE = 12;
// The app header: the window never slides under it.
const TOP = 76;
const NUDGE = 32;

type Pos = { x: number; y: number };

const readPos = (): Pos | null => {
  try {
    const v = JSON.parse(storage.get(POS_KEY) || "null");
    return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? v : null;
  } catch {
    return null;
  }
};

// Keeps the window's header on screen, whatever the viewport did.
const clamp = (p: Pos, w: number, h: number): Pos => ({
  x: Math.min(
    Math.max(EDGE, p.x),
    Math.max(EDGE, window.innerWidth - w - EDGE),
  ),
  y: Math.min(
    Math.max(TOP, p.y),
    Math.max(TOP, window.innerHeight - Math.min(h, 56) - EDGE),
  ),
});

// The chat's box. Docked, it fills its place in the layout; `detachable`
// gives it a header with Pop out. Floating, it's a draggable window (drag it
// by its header, shrink it to a bar, resize it from the corner, put it back).
// It's the same element either way, so switching never remounts the chat
// inside (its scroll position, the draft, a recording).
export default function ChatWindow({
  floating,
  detachable = false,
  onDetach,
  title,
  activity,
  children,
}: {
  floating: boolean;
  detachable?: boolean;
  // true: pop out into a window; false: back into its box.
  onDetach?: (detached: boolean) => void;
  title: string;
  // Changes when Aqua says something new: lights the bar while minimised.
  activity?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [min, setMin] = useState(false);
  // The latest reply when it was last folded or opened.
  const [seenAt, setSeenAt] = useState(activity);
  const drag = useRef<{ dx: number; dy: number; id: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Where it was left last time (after mount: storage and the viewport are
  // browser-only), else the bottom-left corner, where the chat box was.
  useLayoutEffect(() => {
    if (!floating) return;
    const el = ref.current;
    const h = el?.offsetHeight || 600;
    const saved = readPos();
    setPos(
      clamp(
        saved || {
          x: 24,
          y: window.innerHeight - h - 24,
        },
        el?.offsetWidth || W,
        h,
      ),
    );
    setMin(storage.get(MIN_KEY) === "1");
  }, [floating]);

  useEffect(() => {
    if (!floating) return;
    const fit = () => {
      const el = ref.current;
      setPos((p) => (p && el ? clamp(p, el.offsetWidth, el.offsetHeight) : p));
    };
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [floating]);

  // Something new since it was folded away: say so on the bar.
  const unread = min && activity !== seenAt;

  const save = (p: Pos) => storage.set(POS_KEY, JSON.stringify(p));
  const setMinimised = (v: boolean) => {
    setMin(v);
    setSeenAt(activity);
    storage.set(MIN_KEY, v ? "1" : "0");
  };

  // Dragging moves the element directly; React hears where it ended up.
  const onDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    drag.current = {
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      id: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el || d.id !== e.pointerId) return;
    const p = clamp(
      { x: e.clientX - d.dx, y: e.clientY - d.dy },
      el.offsetWidth,
      el.offsetHeight,
    );
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
  };
  const onUp = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (!el) return;
    const p = { x: el.offsetLeft, y: el.offsetTop };
    setPos(p);
    save(p);
  };
  // Arrow keys on the grip move it too.
  const onKey = (e: ReactKeyboardEvent) => {
    const dx =
      e.key === "ArrowLeft" ? -NUDGE : e.key === "ArrowRight" ? NUDGE : 0;
    const dy = e.key === "ArrowUp" ? -NUDGE : e.key === "ArrowDown" ? NUDGE : 0;
    const el = ref.current;
    if ((!dx && !dy) || !el || !pos) return;
    e.preventDefault();
    const p = clamp(
      { x: pos.x + dx, y: pos.y + dy },
      el.offsetWidth,
      el.offsetHeight,
    );
    setPos(p);
    save(p);
  };

  return (
    <div
      ref={ref}
      className={floating ? "aq-glass aq-chatwin" : "aq-chatwin-off"}
      role={floating ? "dialog" : undefined}
      aria-label={floating ? `Chat with Aqua: ${title}` : undefined}
      data-min={floating && min}
      data-dragging={dragging}
      data-placed={!!pos}
      style={floating && pos ? { left: pos.x, top: pos.y } : undefined}
    >
      {detachable && !floating && (
        <header className="aq-chatwin-head" data-docked="true">
          <AquaAvatar size={22} />
          <span className="aq-chatwin-title">{title}</span>
          {onDetach && (
            <button
              type="button"
              className="aq-chatwin-btn"
              onClick={() => onDetach(true)}
              aria-label="Pop the chat out into a window"
              title="Pop out"
            >
              <PictureInPicture2 size={15} aria-hidden="true" />
            </button>
          )}
        </header>
      )}
      {floating && (
        <header
          className="aq-chatwin-head"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onDoubleClick={() => setMinimised(!min)}
        >
          <button
            type="button"
            className="aq-chatwin-grip"
            aria-label="Move the chat window (arrow keys)"
            title="Drag to move"
            onKeyDown={onKey}
          >
            <GripHorizontal size={15} aria-hidden="true" />
          </button>
          <AquaAvatar size={22} />
          <span className="aq-chatwin-title">{title}</span>
          {unread && (
            <span className="aq-chatwin-new" role="status">
              New reply
            </span>
          )}
          {onDetach && (
            <button
              type="button"
              className="aq-chatwin-btn"
              onClick={() => onDetach(false)}
              aria-label="Put the chat back in its box"
              title="Dock"
            >
              <PanelLeft size={15} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="aq-chatwin-btn"
            onClick={() => setMinimised(!min)}
            aria-label={
              min ? "Open the chat window" : "Minimise the chat window"
            }
            aria-expanded={!min}
            title={min ? "Open" : "Minimise"}
          >
            {min ? (
              <Maximize2 size={14} aria-hidden="true" />
            ) : (
              <Minus size={16} aria-hidden="true" />
            )}
          </button>
        </header>
      )}
      <div className="aq-chatwin-body">{children}</div>
    </div>
  );
}
