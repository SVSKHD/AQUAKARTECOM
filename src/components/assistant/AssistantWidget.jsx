import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, Droplets, RotateCcw, Sparkles, Trash, X } from "lucide-react";
import AssistantReply from "./AssistantReply";
import {
  AI_PROMPT_MAX,
  getAiStatus,
  sendAiChat,
  validatePrompt,
} from "@/services/ai";

const STORAGE_KEY = "aquakart.assistant.v1";
const COUNTER_FROM = 1800;

export const ASSISTANT_SUGGESTIONS = [
  "Which softener for my home?",
  "What TDS is safe to drink?",
  "How often should filters be changed?",
  "Do I need a softener for 400 ppm hardness?",
];

// Printable documents and staff tools don't get the floating assistant.
const HIDDEN_ROUTE_PREFIXES = [
  "/admin",
  "/invoice",
  "/invoices",
  "/po/",
  "/quotation",
  "/fetch-invoice",
  "/find-invoice",
  "/page/find-invoice",
];
export const isAssistantRoute = (pathname = "") =>
  !HIDDEN_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));

let idCounter = 0;
const newId = () => `m${Date.now().toString(36)}${(idCounter++).toString(36)}`;

// The server keeps no history, so the conversation survives navigation through
// sessionStorage. Storage can throw (private mode); the chat still works without it.
const readStored = () => {
  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(STORAGE_KEY) || "[]",
    );
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.text === "string",
          )
          .map((m) => ({ id: newId(), role: m.role, text: m.text }))
      : [];
  } catch {
    return [];
  }
};
const writeStored = (messages) => {
  try {
    if (messages.length)
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.map(({ role, text }) => ({ role, text }))),
      );
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

const FOCUSABLE =
  'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

function TypingIndicator() {
  return (
    <div
      role="status"
      className="flex items-center gap-2"
      aria-label="Assistant is typing"
    >
      <span className="flex h-8 items-center gap-1 rounded-2xl rounded-tl-md bg-white px-3.5 shadow-sm ring-1 ring-slate-200/70">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-slate-400">
        Assistant is typing…
      </span>
    </div>
  );
}

const AssistantAvatar = ({ size = "h-8 w-8" }) => (
  <span
    aria-hidden="true"
    className={`${size} grid flex-none place-items-center rounded-full bg-gradient-to-br from-cyan-400 via-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25`}
  >
    <Droplets size={16} />
  </span>
);

const AssistantWidget = ({ pathname = "" }) => {
  const dispatch = useDispatch();
  const {
    open = false,
    prefill = "",
    available = false,
  } = useSelector((state) => state.assistant || {});
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelId = useId();

  const [messages, setMessages] = useState(readStored);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [isSmall, setIsSmall] = useState(
    () => window.matchMedia("(max-width: 639px)").matches,
  );

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const panelRef = useRef(null);
  const fabRef = useRef(null);
  const returnFocusRef = useRef(null);
  const abortRef = useRef(null);

  const visibleOnRoute = isAssistantRoute(pathname);

  // Hide the whole widget unless the backend reports the assistant as configured.
  // Checked after the page settles so it never competes with first paint.
  useEffect(() => {
    let alive = true;
    const run = () =>
      getAiStatus().then((configured) => {
        if (alive)
          dispatch({ type: "SET_ASSISTANT_AVAILABLE", payload: configured });
      });
    const t = window.setTimeout(run, 1200);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [dispatch]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsSmall(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => writeStored(messages), [messages]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const close = useCallback(() => {
    dispatch({ type: "CLOSE_ASSISTANT" });
    const target = returnFocusRef.current;
    window.requestAnimationFrame(() =>
      (target && document.contains(target)
        ? target
        : fabRef.current
      )?.focus?.(),
    );
  }, [dispatch]);

  // Opening: remember what had focus, then move focus into the composer.
  useEffect(() => {
    if (!open) return;
    if (!panelRef.current?.contains(document.activeElement))
      returnFocusRef.current = document.activeElement;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  // "Ask about this product" hands over a prompt to edit, not to send.
  useEffect(() => {
    if (!open || !prefill) return;
    setInput(prefill.slice(0, AI_PROMPT_MAX));
    setError(null);
    dispatch({ type: "CLEAR_ASSISTANT_PREFILL" });
    window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }, [open, prefill, dispatch]);

  // Full-screen sheet on phones behaves as a modal: lock page scroll behind it.
  useEffect(() => {
    if (!open || !isSmall) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isSmall]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending, error, open]);

  // Auto-grow the composer up to ~5 lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input, open]);

  const send = async (raw = input) => {
    if (pending) return;
    const text = String(raw).trim();
    const invalid = validatePrompt(text);
    if (invalid) {
      setError({ kind: "invalid", message: invalid });
      return;
    }
    const history = messages.map(({ role, text: t }) => ({ role, text: t }));
    const userTurn = { id: newId(), role: "user", text };
    const controller = new AbortController();
    abortRef.current = controller;
    setMessages((ms) => [...ms, userTurn]);
    setInput("");
    setError(null);
    setPending(true);
    try {
      const reply = await sendAiChat(text, history, {
        signal: controller.signal,
      });
      setMessages((ms) => [
        ...ms,
        { id: newId(), role: "assistant", text: reply },
      ]);
      setAnnouncement(`AquaKart assistant: ${reply}`);
    } catch (e) {
      if (e?.kind === "aborted") return;
      // A failed turn never enters the history: drop it and give the text back.
      setMessages((ms) => ms.filter((m) => m.id !== userTurn.id));
      setInput((current) => current || text);
      setError({
        kind: e?.kind,
        message: e?.message || "Assistant is unavailable right now.",
        retryable: Boolean(e?.retryable),
        prompt: text,
      });
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setPending(false);
      }
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPending(false);
    setMessages([]);
    setError(null);
    setInput("");
    setAnnouncement("Chat cleared.");
    inputRef.current?.focus();
  };

  const onPanelKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    // Trap focus only while the phone sheet covers the page.
    if (e.key !== "Tab" || !isSmall || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!available || !visibleOnRoute) return null;

  const tooLong = input.length > AI_PROMPT_MAX;
  const canSend = !pending && !!input.trim() && !tooLong;
  const empty = messages.length === 0 && !pending;

  return (
    <>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>

      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            ref={fabRef}
            type="button"
            onClick={() => dispatch({ type: "OPEN_ASSISTANT", payload: {} })}
            aria-label="Open AquaKart assistant"
            aria-haspopup="dialog"
            aria-expanded={false}
            aria-controls={panelId}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }
            }
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="aq-assist-fab group fixed right-4 z-[80] inline-flex h-14 items-center gap-2 rounded-full bg-slate-950 pl-2 pr-2 text-white shadow-[0_18px_45px_rgba(2,6,23,0.35)] ring-1 ring-white/10 transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/60 sm:right-6 sm:pr-5"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-400 via-emerald-500 to-teal-600 shadow-inner">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <span className="hidden text-sm font-black tracking-tight sm:inline">
              Ask AquaKart
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal={isSmall ? "true" : undefined}
            aria-labelledby={titleId}
            onKeyDown={onPanelKeyDown}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: isSmall ? 1 : 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: isSmall ? 1 : 0.97 }
            }
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[95] flex flex-col overflow-hidden bg-[linear-gradient(180deg,#f3fbf8_0%,#f8fafc_55%,#eef4ff_100%)] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-[1.75rem] sm:border sm:border-white/80 sm:pb-0 sm:pt-0 sm:shadow-[0_30px_90px_rgba(15,23,42,0.28)] sm:ring-1 sm:ring-slate-900/5"
          >
            {/* header */}
            <header className="flex flex-none items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl">
              <AssistantAvatar size="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <h2
                  id={titleId}
                  className="truncate text-sm font-black tracking-tight text-slate-950"
                >
                  AquaKart assistant
                </h2>
                <p className="truncate text-xs font-medium text-slate-500">
                  Purifiers, softeners, water quality &amp; orders
                </p>
              </div>
              <button
                type="button"
                onClick={clearChat}
                disabled={!messages.length && !pending}
                aria-label="Clear chat"
                title="Clear chat"
                className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={close}
                aria-label="Close assistant"
                className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {/* conversation */}
            <div
              ref={listRef}
              className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5"
            >
              {empty ? (
                <div className="flex flex-col items-start gap-4">
                  <div className="flex gap-2.5">
                    <AssistantAvatar />
                    <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                      Hi! I can help you choose a water purifier or softener,
                      explain TDS and hardness, or answer questions about your
                      order.
                    </div>
                  </div>
                  <div className="w-full pl-10">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Try asking
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ASSISTANT_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="min-h-10 rounded-full border border-emerald-200 bg-white px-3.5 text-left text-xs font-bold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-slate-950 px-4 py-2.5 text-sm leading-6 text-white shadow-sm">
                        {m.text}
                      </p>
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-2.5">
                      <AssistantAvatar />
                      <div className="min-w-0 max-w-[85%] break-words rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                        <AssistantReply text={m.text} />
                      </div>
                    </div>
                  ),
                )
              )}

              {pending && (
                <div className="flex gap-2.5">
                  <AssistantAvatar />
                  <TypingIndicator />
                </div>
              )}

              {error && error.kind !== "invalid" && (
                <div
                  role="alert"
                  className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                  <p className="font-semibold">{error.message}</p>
                  {error.retryable && (
                    <button
                      type="button"
                      onClick={() => send(error.prompt)}
                      disabled={pending}
                      className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-full bg-rose-600 px-3.5 text-xs font-black text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      <RotateCcw size={13} aria-hidden="true" />
                      Try again
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* composer */}
            <form
              className="flex-none border-t border-slate-200/70 bg-white/85 px-3 pb-3 pt-2.5 backdrop-blur-xl"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <div className="flex items-end gap-2 rounded-[1.35rem] border border-slate-200 bg-white p-1.5 pl-3.5 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-400/15">
                <label htmlFor={`${panelId}-input`} className="sr-only">
                  Message the AquaKart assistant
                </label>
                <textarea
                  id={`${panelId}-input`}
                  ref={inputRef}
                  rows={1}
                  value={input}
                  maxLength={AI_PROMPT_MAX}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (error?.kind === "invalid") setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask about purifiers, softeners or your water…"
                  aria-invalid={error?.kind === "invalid" || tooLong}
                  aria-describedby={`${panelId}-hint`}
                  className="max-h-[132px] min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label={
                    pending ? "Waiting for the assistant" : "Send message"
                  }
                  className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                >
                  {pending ? (
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"
                    />
                  ) : (
                    <ArrowUp size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              <div
                id={`${panelId}-hint`}
                className="mt-1.5 flex items-start justify-between gap-3 px-1 text-[11px] leading-4"
              >
                {error?.kind === "invalid" ? (
                  <span role="alert" className="font-semibold text-rose-600">
                    {error.message}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    AI answers can be wrong. Check prices, stock and offers on
                    the product page.
                  </span>
                )}
                {input.length >= COUNTER_FROM && (
                  <span
                    className={`flex-none font-bold tabular-nums ${tooLong ? "text-rose-600" : "text-slate-400"}`}
                  >
                    {input.length}/{AI_PROMPT_MAX}
                  </span>
                )}
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
};

export default AssistantWidget;
