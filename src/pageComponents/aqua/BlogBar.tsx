"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Headphones,
  Square,
  X,
} from "lucide-react";
import { storage } from "./hooks";
import { podcastScript, type BlogRead } from "./blogReads";
import {
  canSpeak,
  speak,
  speakingNow,
  stopSpeaking,
  useSpeaking,
} from "./ReplyActions";

export const BLOG_BAR_POS_KEY = "aqua.reads.pos";

type Pos = { x: number; y: number };
type Props = {
  reads: BlogRead[];
  // Where it starts before it's ever moved: bottom right, above the composer.
  bottomOffset: number;
  // A read picked in the history dock: the bar opens on it, expanded.
  focusId?: string | null;
  onDock: () => void;
};

const EDGE = 8;
const NUDGE = 24;

const readPos = (): Pos | null => {
  try {
    const v = JSON.parse(storage.get(BLOG_BAR_POS_KEY) || "null");
    return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? v : null;
  } catch {
    return null;
  }
};

const podcastId = (r: BlogRead) => `blog:${r.id}`;

// A small floating card of Aquakart blog reads, read in place (never a new
// window) or played as a podcast. Drag it by its grip (or nudge it with the
// arrow keys there); × tucks it into the history dock.
export default function BlogBar({
  reads,
  bottomOffset,
  focusId,
  onDock,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<Pos | null>(readPos);
  const [i, setI] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const read = reads.length ? reads[i % reads.length] : null;
  const playing = useSpeaking(read ? podcastId(read) : "");
  const speakable = canSpeak();

  // Opened from the dock on a particular read.
  useEffect(() => {
    if (!focusId) return;
    const at = reads.findIndex((r) => r.id === focusId);
    if (at < 0) return;
    setI(at);
    setExpanded(true);
  }, [focusId, reads]);

  // A podcast started here stops when the bar goes (closed or hidden).
  const readsRef = useRef(reads);
  readsRef.current = reads;
  useEffect(
    () => () => {
      const now = speakingNow();
      if (now && readsRef.current.some((r) => podcastId(r) === now))
        stopSpeaking();
    },
    [],
  );
  const drag = useRef<{ dx: number; dy: number; id: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Keeps the bar fully on screen (also after a resize or rotation).
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
  useEffect(() => {
    if (!pos) return;
    const fit = () => setPos((p) => (p ? clamp(p) : p));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
    // only re-run when it gains a position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos === null, clamp]);

  const save = (p: Pos) => storage.set(BLOG_BAR_POS_KEY, JSON.stringify(p));
  const current = (): Pos => {
    const el = ref.current;
    return el ? { x: el.offsetLeft, y: el.offsetTop } : { x: EDGE, y: EDGE };
  };

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const start = pos || current();
    drag.current = {
      dx: e.clientX - start.x,
      dy: e.clientY - start.y,
      id: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setPos(clamp({ x: e.clientX - d.dx, y: e.clientY - d.dy }));
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    setPos((p) => {
      if (p) save(p);
      return p;
    });
  };
  const onGripKey = (e: ReactKeyboardEvent) => {
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
    save(next);
  };

  if (!read) return null;
  const go = (d: number) => {
    setI((n) => (n + d + reads.length) % reads.length);
    setExpanded(false);
  };
  const listen = () =>
    playing ? stopSpeaking() : speak(podcastId(read), podcastScript(read));

  return (
    <aside
      ref={ref}
      className="aq-glass aq-blogbar"
      aria-label="Water reads from the Aquakart blog"
      data-dragging={dragging}
      style={
        pos
          ? { left: pos.x, top: pos.y }
          : { right: 16, bottom: bottomOffset + 16 }
      }
    >
      <div className="aq-blogbar-head">
        <button
          type="button"
          className="aq-blogbar-grip"
          aria-label="Move the reads bar (drag, or use the arrow keys)"
          title="Drag to move"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onGripKey}
        >
          <GripVertical size={14} aria-hidden="true" />
          <BookOpen size={13} aria-hidden="true" />
          <span>Water reads</span>
        </button>
        <span className="aq-blogbar-count" aria-live="polite">
          {(i % reads.length) + 1}/{reads.length}
        </span>
        {reads.length > 1 && (
          <>
            <button
              type="button"
              className="aq-blogbar-btn"
              onClick={() => go(-1)}
              aria-label="Previous read"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="aq-blogbar-btn"
              onClick={() => go(1)}
              aria-label="Next read"
            >
              <ChevronRight size={15} />
            </button>
          </>
        )}
        <button
          type="button"
          className="aq-blogbar-btn"
          onClick={onDock}
          aria-label="Move reads to the history sidebar"
          title="Move to history"
        >
          <X size={15} />
        </button>
      </div>
      <div className="aq-blogbar-read">
        <button
          type="button"
          className="aq-blogbar-open"
          aria-expanded={expanded}
          aria-controls="aq-blogbar-body"
          onClick={() => setExpanded((v) => !v)}
        >
          {read.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- CMS images on Cloudinary
            <img
              src={read.image}
              alt=""
              className="aq-blogbar-img"
              loading="lazy"
            />
          ) : (
            <span className="aq-blogbar-img" aria-hidden="true">
              <BookOpen size={16} />
            </span>
          )}
          <span className="aq-blogbar-text">
            <b>{read.title}</b>
            <span>
              {read.minutes} min read
              {playing ? " · Playing" : expanded ? "" : " · Tap to read"}
            </span>
          </span>
          <ChevronDown
            size={15}
            aria-hidden="true"
            className="aq-blogbar-chev"
            data-open={expanded}
          />
        </button>
        {speakable && (
          <button
            type="button"
            className="aq-blogbar-listen"
            aria-pressed={playing}
            onClick={listen}
          >
            {playing ? (
              <>
                <Square size={11} fill="currentColor" aria-hidden="true" />
                Stop podcast
                <span className="aq-read-eq" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </>
            ) : (
              <>
                <Headphones size={14} aria-hidden="true" />
                Listen as podcast
              </>
            )}
          </button>
        )}
      </div>
      {/* Read right here: the chat stays where it is, no new window. */}
      <div
        id="aq-blogbar-body"
        className="aq-blogbar-body aq-noscroll"
        hidden={!expanded}
      >
        {read.summary && <p className="aq-blogbar-summary">{read.summary}</p>}
        {read.highlights.length > 0 && (
          <ul>
            {read.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        {read.paragraphs.map((t, n) => (
          <p key={n}>{t}</p>
        ))}
      </div>
    </aside>
  );
}
