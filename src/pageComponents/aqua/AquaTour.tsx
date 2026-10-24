"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Clock,
  Droplets,
  MessageSquareText,
  MousePointerClick,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { useReducedMotion } from "./hooks";

export const TOUR_KEY = "aqua.tour.v1";

type Step = {
  // Matches [data-tour="…"]. No target: a centred intro card.
  target?: string;
  title: string;
  body: string;
  Icon: typeof Sparkles;
};

const STEPS: Step[] = [
  {
    title: "Meet Aqua, your water expert",
    body: "Aqua is Aquakart's AI assistant. Ask about your water, compare softeners and purifiers, and buy without leaving the chat. This takes 30 seconds.",
    Icon: Sparkles,
  },
  {
    target: "composer",
    title: "Ask anything",
    body: "Type or use the mic. Try “Which softener suits a 3BHK in Gachibowli?” Aqua answers from the live catalogue.",
    Icon: MessageSquareText,
  },
  {
    target: "hardness",
    title: "Know your water first",
    body: "Pick your city and area for a hardness estimate. Aqua uses it to suggest the right product and size.",
    Icon: Droplets,
  },
  {
    target: "suggestions",
    title: "Not sure where to start?",
    body: "Tap a suggestion and Aqua takes it from there.",
    Icon: MousePointerClick,
  },
  {
    target: "thinking",
    title: "See how Aqua thinks",
    body: "Turn this on to see the steps behind each answer. Off gives faster replies.",
    Icon: Brain,
  },
  {
    target: "shop",
    title: "Cart and favourites",
    body: "Products you save or add from the chat land here, and checkout happens right in the chat.",
    Icon: ShoppingCart,
  },
  {
    target: "history",
    title: "Pick up where you left off",
    body: "Your chats and the products you viewed are kept here. You can replay this tour from there anytime.",
    Icon: Clock,
  },
];

const PAD = 8; // spotlight breathing room around the target
const GAP = 14; // between spotlight and card
const GUTTER = 16;

type Box = { top: number; left: number; width: number; height: number };

const targetEl = (s: Step) =>
  s.target
    ? document.querySelector<HTMLElement>(`[data-tour="${s.target}"]`)
    : null;
const shown = (el: HTMLElement | null) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

export default function AquaTour({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (finished: boolean) => void;
}) {
  const reduced = useReducedMotion();
  // Steps whose target is on screen when the tour opens (e.g. no thinking toggle on mobile).
  const [steps, setSteps] = useState<Step[]>([]);
  const [i, setI] = useState(0);
  const [spot, setSpot] = useState<Box | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    setSteps(STEPS.filter((s) => !s.target || shown(targetEl(s))));
    setI(0);
  }, [open]);

  const step = steps[i];
  const last = i === steps.length - 1;

  // Spotlight the target and place the card beside it (below if it fits, else above).
  const measure = useCallback(() => {
    if (!step) return;
    const el = targetEl(step);
    const card = cardRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card?.offsetWidth ?? 340;
    const ch = card?.offsetHeight ?? 200;
    if (!el || !shown(el)) {
      setSpot(null);
      setCardPos({
        top: Math.max(GUTTER, (vh - ch) / 2),
        left: Math.max(GUTTER, (vw - cw) / 2),
      });
      return;
    }
    const r = el.getBoundingClientRect();
    const box = {
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    };
    setSpot(box);
    const below = box.top + box.height + GAP;
    const above = box.top - GAP - ch;
    const top =
      below + ch <= vh - GUTTER
        ? below
        : above >= GUTTER
          ? above
          : Math.min(Math.max(GUTTER, below), vh - ch - GUTTER);
    const left = Math.min(
      Math.max(GUTTER, r.left + r.width / 2 - cw / 2),
      vw - cw - GUTTER,
    );
    setCardPos({ top, left });
  }, [step]);

  // Bring the target into view, then keep measuring while it moves or resizes.
  useEffect(() => {
    if (!open || !step) return;
    const el = targetEl(step);
    el?.scrollIntoView({
      block: "center",
      behavior: reduced ? "auto" : "smooth",
    });
    measure();
    const settle = window.setTimeout(measure, reduced ? 0 : 380);
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    if (cardRef.current) ro.observe(cardRef.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    nextRef.current?.focus({ preventScroll: true });
    return () => {
      clearTimeout(settle);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, measure, reduced]);

  const next = useCallback(
    () => (last ? onClose(true) : setI((n) => n + 1)),
    [last, onClose],
  );
  const back = useCallback(() => setI((n) => Math.max(0, n - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, back, onClose]);

  if (!open || !step) return null;
  const { Icon } = step;
  const move = reduced
    ? "none"
    : "top .45s cubic-bezier(.22,.8,.24,1), left .45s cubic-bezier(.22,.8,.24,1), width .45s cubic-bezier(.22,.8,.24,1), height .45s cubic-bezier(.22,.8,.24,1)";

  return (
    <div className="aq-tour" role="presentation">
      {/* Catches clicks so the page under the tour can't be used mid-tour. */}
      <div className="aq-tour-catch" />
      <div
        className="aq-tour-spot"
        aria-hidden="true"
        data-intro={!spot}
        style={
          spot
            ? { ...spot, transition: move }
            : { top: "50%", left: "50%", width: 0, height: 0, transition: move }
        }
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="aq-tour-title"
        aria-describedby="aq-tour-body"
        className="aq-tour-card"
        style={{
          top: cardPos?.top ?? -9999,
          left: cardPos?.left ?? -9999,
          transition: reduced
            ? "none"
            : "top .45s cubic-bezier(.22,.8,.24,1), left .45s cubic-bezier(.22,.8,.24,1)",
        }}
      >
        <div key={i} className="aq-tour-content">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="aq-tour-icon" aria-hidden="true">
              <Icon size={17} />
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 11.5,
                fontWeight: 700,
                color: "var(--aq-mut)",
              }}
            >
              Step {i + 1} of {steps.length}
            </span>
            <button
              type="button"
              className="aq-tour-skip"
              onClick={() => onClose(false)}
            >
              Skip tour <X size={13} aria-hidden="true" />
            </button>
          </div>
          <h2 id="aq-tour-title" className="aq-tour-title">
            {step.title}
          </h2>
          <p id="aq-tour-body" className="aq-tour-body">
            {step.body}
          </p>
        </div>
        <div className="aq-tour-progress" aria-hidden="true">
          {steps.map((s, n) => (
            <i key={s.title} data-on={n <= i} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {i > 0 ? (
            <button
              type="button"
              className="aq-btn aq-btn-ghost"
              onClick={back}
              style={{ height: 36, padding: "0 10px", fontSize: 13 }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <span style={{ fontSize: 11.5, color: "var(--aq-mut2)" }}>
              Tip: use ← → keys
            </span>
          )}
          <span style={{ flex: 1 }} />
          <button
            ref={nextRef}
            type="button"
            className="aq-btn aq-btn-primary"
            onClick={next}
            style={{ height: 36, padding: "0 16px", fontSize: 13 }}
          >
            {i === 0 ? "Show me around" : last ? "Start chatting" : "Next"}{" "}
            {!last && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
