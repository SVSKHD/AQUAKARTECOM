import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  Brain,
  Droplets,
  LogIn,
  MessageCircle,
  Package,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trash,
  X,
} from "lucide-react";
import AssistantReply from "./AssistantReply";
import ThinkingSteps from "./ThinkingSteps";
import SupportNote from "./SupportNote";
import { suggestFollowUps } from "@/utils/aiFollowUps";
import {
  AI_PROMPT_MAX,
  formatResetIST,
  carryGuestQuota,
  getAiChat,
  getAiQuota,
  getAiStatus,
  limitFromQuota,
  listAiChats,
  onTokenRejected,
  quotaLabel,
  readThinkingPref,
  streamAiChat,
  validatePrompt,
  writeThinkingPref,
} from "@/services/ai";

const STORAGE_KEY = "aquakart.assistant.v1";
const SESSION_KEY = "aquakart.assistant.session";
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
// Except a customer's own invoice, so existing customers can ask from there
// (the widget is print-hidden, so the printed invoice stays clean).
const SHOWN_ROUTES = new Set(["/invoice/[id]"]);
export const isAssistantRoute = (pathname = "") =>
  SHOWN_ROUTES.has(pathname) ||
  !HIDDEN_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));

let idCounter = 0;
const newId = () => `m${Date.now().toString(36)}${(idCounter++).toString(36)}`;

// A logged-in customer's conversation survives navigation and refresh through
// sessionStorage (and is saved on the server too); a guest's isn't stored.
// Storage can throw (private mode); the chat still works without it.
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
          .map((m) => ({
            id: newId(),
            role: m.role,
            text: m.text,
            ...(m.stopped ? { stopped: true } : {}),
            ...(Array.isArray(m.thoughts) && m.thoughts.length
              ? {
                  thoughts: m.thoughts
                    .filter((t) => t && typeof t.text === "string")
                    .map((t) => ({
                      title: typeof t.title === "string" ? t.title : null,
                      text: t.text,
                    })),
                }
              : {}),
          }))
      : [];
  } catch {
    return [];
  }
};
const writeStored = (messages, sessionId) => {
  try {
    if (messages.length) {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          messages.map(({ role, text, thoughts, stopped }) => ({
            role,
            text,
            ...(thoughts?.length ? { thoughts } : {}),
            ...(stopped ? { stopped } : {}),
          })),
        ),
      );
      if (sessionId) window.sessionStorage.setItem(SESSION_KEY, sessionId);
      else window.sessionStorage.removeItem(SESSION_KEY);
    } else clearStored();
  } catch {
    // ignore
  }
};
const clearStored = () => {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};
const readStoredSession = () => {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) || null;
  } catch {
    return null;
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

const inr = (value) =>
  `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;

// A product from the page's context ("Products for you" tab in the drawer).
function ContextProductCard({ product, onAsk }) {
  const off =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  const facts = [
    product.capacity && `Capacity ${product.capacity}`,
    product.flow && `Flow ${product.flow}`,
    product.warranty && `Warranty ${product.warranty}`,
  ].filter(Boolean);
  return (
    <article className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
      <div className="grid h-24 w-20 flex-none place-items-center overflow-hidden rounded-xl bg-gradient-to-b from-emerald-50 to-slate-50 ring-1 ring-slate-100">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <Package size={22} className="text-emerald-600" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[13px] font-black leading-5 text-slate-950">
            {product.title}
          </h3>
          {!product.inStock && (
            <span className="flex-none rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
              Sold out
            </span>
          )}
        </div>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
          <strong className="font-black text-emerald-700">
            {inr(product.price)}
          </strong>
          {off > 0 && (
            <>
              <s className="text-xs text-slate-400">{inr(product.mrp)}</s>
              <span className="text-[11px] font-bold text-emerald-600">
                {off}% off
              </span>
            </>
          )}
        </p>
        {facts.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {facts.map((f) => (
              <li
                key={f}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
              >
                {f}
              </li>
            ))}
          </ul>
        )}
        {product.description && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-slate-500">
            {product.description}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onAsk(product)}
            className="inline-flex min-h-8 items-center gap-1 rounded-full bg-slate-950 px-3 text-[11px] font-black text-white transition hover:bg-slate-800"
          >
            <Sparkles size={12} aria-hidden="true" /> Ask AI
          </button>
          <a
            href={product.href}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-emerald-200 px-3 text-[11px] font-black text-emerald-800 transition hover:bg-emerald-50"
          >
            View <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

const AssistantWidget = ({ pathname = "" }) => {
  const dispatch = useDispatch();
  const {
    open = false,
    prefill = "",
    available = false,
    tab: requestedTab = "chat",
    context = null,
  } = useSelector((state) => state.assistant || {});
  // A page can host the assistant as a full-height drawer with its own
  // questions and a "Products for you" tab (the receipt page does).
  const drawer = context?.variant === "drawer";
  const contextProducts = drawer ? context.products || [] : [];
  const [tab, setTab] = useState("chat");
  useEffect(() => {
    if (open) setTab(requestedTab === "products" ? "products" : "chat");
  }, [open, requestedTab]);
  // Logged-in customers send their token (5 questions a day); guests get 3.
  const token = useSelector((state) => state.userData?.token) || null;
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
  // The answer being streamed: { thoughts, text, phase: "thinking" | "answering" }.
  const [live, setLive] = useState(null);
  // Which answers have their thinking steps expanded ("live" for the one streaming).
  const [expanded, setExpanded] = useState({});
  const [showThinking, setShowThinking] = useState(readThinkingPref);
  // Daily questions, always as the server last reported them (never counted here).
  // `limit` ({ message, loginRequired }) disables the composer until it lifts.
  const [quota, setQuota] = useState(null);
  const [limit, setLimit] = useState(null);
  const applyQuota = useCallback((q, hit) => {
    if (q) setQuota(q);
    setLimit((current) => hit || (q ? limitFromQuota(q) : current));
  }, []);
  // Set when "Log in" closes the panel, so it reopens once the login lands.
  const reopenAfterLoginRef = useRef(false);
  const liveTurnRef = useRef(null);

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

  // ---------- saved conversations (logged-in customers; guests aren't stored) ----------
  // The customer's saved conversation; null means the next answer starts one.
  const sessionIdRef = useRef(readStoredSession());
  // Answers this tab got as a guest (per the server's quota tier), carried into
  // the account's daily count when the customer logs in mid-chat.
  const guestAnswersRef = useRef(0);
  const prevTokenRef = useRef(token);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Read today's questions when the chat opens and whenever the login changes.
  // Doesn't use a question. Also carries guest questions over on login, and
  // loads the latest saved chat when nothing is on screen.
  useEffect(() => {
    if (!open || !available) return;
    const ctl = new AbortController();
    const was = prevTokenRef.current;
    prevTokenRef.current = token;
    (async () => {
      if (token && !was && guestAnswersRef.current > 0) {
        const carried = await carryGuestQuota(token);
        if (ctl.signal.aborted) return;
        guestAnswersRef.current = 0;
        applyQuota(
          carried ?? (await getAiQuota(token, { signal: ctl.signal })),
        );
        return;
      }
      const q = await getAiQuota(token, { signal: ctl.signal });
      if (ctl.signal.aborted) return;
      applyQuota(q);
      if (!token || messagesRef.current.length) return;
      const [latest] = await listAiChats(token, { limit: 1 });
      const chat = latest && (await getAiChat(latest.id, token));
      if (
        !chat?.messages.length ||
        ctl.signal.aborted ||
        messagesRef.current.length
      )
        return;
      sessionIdRef.current = chat.id;
      setMessages(
        chat.messages.map((t) => ({ id: newId(), role: t.role, text: t.text })),
      );
    })();
    return () => ctl.abort();
  }, [open, available, token, applyQuota]);

  // Logged out: saved chats belong to the account, so stop saving this one.
  // (Only on a real logout — the token can still be rehydrating at mount.)
  const hadTokenRef = useRef(!!token);
  useEffect(() => {
    if (token) {
      hadTokenRef.current = true;
      return;
    }
    if (!hadTokenRef.current) return;
    hadTokenRef.current = false;
    sessionIdRef.current = null;
    clearStored();
  }, [token]);

  // The server rejected the stored token (expired, or another environment's):
  // end the session properly instead of showing a logged-in customer guest limits.
  useEffect(
    () =>
      onTokenRejected((rejected) => {
        if (rejected !== token) return;
        dispatch({ type: "LOGOUT", payload: null });
        setError({
          kind: "unauthorized",
          message: "Your session expired. Please log in again.",
        });
      }),
    [token, dispatch],
  );

  // Back from "Log in for 5 questions a day": reopen the chat, conversation intact.
  useEffect(() => {
    if (!token || !reopenAfterLoginRef.current) return;
    reopenAfterLoginRef.current = false;
    dispatch({ type: "OPEN_ASSISTANT", payload: {} });
  }, [token, dispatch]);

  // Only logged-in customers' chats survive a refresh.
  useEffect(() => {
    if (token) writeStored(messages, sessionIdRef.current);
  }, [messages, token]);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Stops the answer in flight. Its question stays visible, marked as stopped,
  // and is left out of the history sent with later questions.
  const stopCurrent = useCallback(() => {
    if (!abortRef.current) return;
    abortRef.current.abort();
    abortRef.current = null;
    const turnId = liveTurnRef.current;
    liveTurnRef.current = null;
    if (turnId)
      setMessages((ms) =>
        ms.map((m) => (m.id === turnId ? { ...m, stopped: true } : m)),
      );
    setLive(null);
    setPending(false);
  }, []);

  const close = useCallback(() => {
    stopCurrent();
    dispatch({ type: "CLOSE_ASSISTANT" });
    const target = returnFocusRef.current;
    window.requestAnimationFrame(() =>
      (target && document.contains(target)
        ? target
        : fabRef.current
      )?.focus?.(),
    );
  }, [dispatch, stopCurrent]);

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

  // The phone sheet and the drawer behave as modals: lock page scroll behind them.
  const modal = isSmall || drawer;
  useEffect(() => {
    if (!open || !modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, modal]);

  useEffect(() => {
    const el = listRef.current;
    if (el && tab === "chat") el.scrollTop = el.scrollHeight;
  }, [messages, pending, error, open, live, tab]);

  // Auto-grow the composer up to ~5 lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input, open]);

  const send = async (raw = input) => {
    const text = String(raw).trim();
    const invalid = validatePrompt(text);
    if (invalid) {
      setError({ kind: "invalid", message: invalid });
      return;
    }
    if (limit) return;
    // A new message replaces the one still streaming.
    const stoppedId = abortRef.current ? liveTurnRef.current : null;
    stopCurrent();
    // Only { role, text } of completed turns goes back to the server, never thoughts.
    const history = messages
      .filter((m) => !m.stopped && m.id !== stoppedId)
      .map(({ role, text: t }) => ({ role, text: t }));
    const userTurn = { id: newId(), role: "user", text };
    const controller = new AbortController();
    abortRef.current = controller;
    liveTurnRef.current = userTurn.id;
    const thinking = showThinking;
    setMessages((ms) => [...ms, userTurn]);
    setInput("");
    setError(null);
    setPending(true);
    setLive({ thoughts: [], text: "", phase: "thinking" });
    setExpanded((x) => ({ ...x, live: false }));
    const isCurrent = () => abortRef.current === controller;
    try {
      const answer = await streamAiChat(text, history, {
        signal: controller.signal,
        token,
        sessionId: sessionIdRef.current,
        thinking,
        onThought: (index, thought) => {
          if (!isCurrent()) return;
          setLive((l) => {
            if (!l) return l;
            const thoughts = [...l.thoughts];
            thoughts[index] = thought;
            return { ...l, thoughts };
          });
        },
        onDelta: (chunk) => {
          if (!isCurrent()) return;
          // First answer text collapses the steps into a toggle.
          setLive(
            (l) => l && { ...l, text: l.text + chunk, phase: "answering" },
          );
        },
      });
      if (!isCurrent()) return;
      if (answer.sessionId) sessionIdRef.current = answer.sessionId;
      if (answer.quota?.tier === "guest") guestAnswersRef.current += 1;
      const id = newId();
      setMessages((ms) => [
        ...ms,
        {
          id,
          role: "assistant",
          text: answer.reply,
          ...(answer.thoughts.length ? { thoughts: answer.thoughts } : {}),
        },
      ]);
      setExpanded((x) => ({ ...x, [id]: Boolean(x.live), live: false }));
      setAnnouncement(`AquaKart assistant: ${answer.reply}`);
      applyQuota(answer.quota);
    } catch (e) {
      if (e?.kind === "aborted" || !isCurrent()) return;
      // A failed turn never enters the history: drop it and give the text back.
      setMessages((ms) => ms.filter((m) => m.id !== userTurn.id));
      setInput((current) => current || text);
      if (e?.kind === "daily_limit") {
        // The question waits in the composer to be sent after login or midnight.
        applyQuota(e.quota, {
          message: e.message,
          loginRequired: Boolean(e.loginRequired),
        });
        setAnnouncement(e.message);
        return;
      }
      setError({
        kind: e?.kind,
        message: e?.message || "Assistant is unavailable right now.",
        retryable: Boolean(e?.retryable),
        partial: e?.partial || "",
        prompt: text,
      });
    } finally {
      if (isCurrent()) {
        abortRef.current = null;
        liveTurnRef.current = null;
        setPending(false);
        setLive(null);
      }
    }
  };

  const toggleThinking = () => {
    setShowThinking((on) => {
      writeThinkingPref(!on);
      return !on;
    });
  };

  const clearChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    liveTurnRef.current = null;
    setLive(null);
    setPending(false);
    setMessages([]);
    sessionIdRef.current = null;
    setExpanded({});
    setError(null);
    setInput("");
    setAnnouncement("Chat cleared.");
    inputRef.current?.focus();
  };

  // "Ask AI" on a product card: back to the chat with that product's question.
  const askAboutProduct = (product) => {
    setTab("chat");
    send(
      product.question || `Tell me about ${product.title}. Is it right for me?`,
    );
  };

  const onPanelKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    // Trap focus only while the phone sheet or the drawer covers the page.
    if (e.key !== "Tab" || !modal || !panelRef.current) return;
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
  // Sending while an answer streams stops that answer and asks the new question.
  const canSend = !!input.trim() && !tooLong && !limit;
  const resetAt = quota ? formatResetIST(quota.resetsAt) : "";

  // The login dialog sits below this panel, so the panel steps aside and reopens
  // after login; the conversation is kept in sessionStorage meanwhile.
  const openLogin = () => {
    reopenAfterLoginRef.current = true;
    close();
    dispatch({ type: "SET_AUTH_DIALOG_VISIBLE", payload: true });
  };
  const empty = messages.length === 0 && !pending;
  // The support note sits under the most recent answer, with the question it answered.
  const latestAnswer = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role !== "assistant") continue;
      const asked = messages
        .slice(0, i)
        .reverse()
        .find((m) => m.role === "user");
      return {
        id: messages[i].id,
        question: asked?.text || "",
        reply: messages[i].text,
      };
    }
    return null;
  })();
  // Suggested next questions for the latest answer (never one already asked).
  const followUps = latestAnswer
    ? suggestFollowUps(
        latestAnswer.question,
        latestAnswer.reply,
        messages.filter((m) => m.role === "user").map((m) => m.text),
      )
    : [];

  // The drawer slides in from the right; the floating panel rises into place.
  const panelHidden = reduceMotion
    ? { opacity: 0 }
    : drawer && !isSmall
      ? { opacity: 1, x: "100%" }
      : { opacity: 0, y: 24, scale: isSmall ? 1 : 0.97 };

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
            className="aq-assist-fab group fixed right-4 print:hidden z-[80] inline-flex h-14 items-center gap-2 rounded-full bg-slate-950 pl-2 pr-2 text-white shadow-[0_18px_45px_rgba(2,6,23,0.35)] ring-1 ring-white/10 transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/60 sm:right-6 sm:pr-5"
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
        {open && drawer && (
          <motion.div
            key="scrim"
            aria-hidden="true"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[94] hidden bg-slate-950/40 backdrop-blur-[2px] print:hidden sm:block"
          />
        )}
        {open && (
          <motion.section
            key="panel"
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal={modal ? "true" : undefined}
            aria-labelledby={titleId}
            onKeyDown={onPanelKeyDown}
            initial={panelHidden}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={panelHidden}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-0 z-[95] flex flex-col print:hidden overflow-hidden bg-[linear-gradient(180deg,#f3fbf8_0%,#f8fafc_55%,#eef4ff_100%)] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] sm:pb-0 sm:pt-0 ${
              drawer
                ? "sm:left-auto sm:w-[440px] sm:rounded-l-[1.75rem] sm:border-l sm:border-white/80 sm:shadow-[-30px_0_90px_rgba(15,23,42,0.28)]"
                : "sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-[1.75rem] sm:border sm:border-white/80 sm:shadow-[0_30px_90px_rgba(15,23,42,0.28)] sm:ring-1 sm:ring-slate-900/5"
            }`}
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
                  {(drawer && context.subtitle) ||
                    "Purifiers, softeners, water quality & orders"}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleThinking}
                aria-pressed={showThinking}
                aria-label="Show thinking steps"
                title={
                  showThinking
                    ? "Thinking steps on. Turn off for faster replies."
                    : "Thinking steps off. Turn on to see how answers are worked out."
                }
                className={`grid h-10 w-10 place-items-center rounded-full transition ${
                  showThinking
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <Brain size={16} aria-hidden="true" />
              </button>
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

            {contextProducts.length > 0 && (
              <div
                role="tablist"
                aria-label="Assistant views"
                className="flex flex-none gap-1 border-b border-slate-200/70 bg-white/70 p-1.5"
              >
                {[
                  { id: "chat", label: "Chat", icon: MessageCircle },
                  {
                    id: "products",
                    label: "Products for you",
                    icon: ShoppingBag,
                    count: contextProducts.length,
                  },
                ].map(({ id, label, icon: Icon, count }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-black transition ${
                      tab === id
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                    {count ? (
                      <span
                        className={`rounded-full px-1.5 text-[10px] ${tab === id ? "bg-white/20" : "bg-emerald-100 text-emerald-800"}`}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}

            {tab === "products" && contextProducts.length > 0 && (
              <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
                <p className="text-xs leading-5 text-slate-500">
                  {context.productsIntro ||
                    "Picked to go with what you bought. Ask the assistant about any of them."}
                </p>
                {contextProducts.map((p) => (
                  <ContextProductCard
                    key={p.id}
                    product={p}
                    onAsk={askAboutProduct}
                  />
                ))}
              </div>
            )}

            {/* conversation */}
            <div
              ref={listRef}
              className={`flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 ${tab === "products" && contextProducts.length ? "hidden" : ""}`}
            >
              {empty ? (
                <div className="flex flex-col items-start gap-4">
                  <div className="flex gap-2.5">
                    <AssistantAvatar />
                    <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                      {(drawer && context.greeting) ||
                        "Hi! I can help you choose a water purifier or softener, explain TDS and hardness, or answer questions about your order."}
                    </div>
                  </div>
                  <div className="w-full pl-10">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                      {drawer && context.suggestions?.length
                        ? "Ask about your purchase"
                        : "Try asking"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(drawer && context.suggestions?.length
                        ? context.suggestions
                        : ASSISTANT_SUGGESTIONS
                      ).map((s) => (
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
                    {contextProducts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTab("products")}
                        className="mt-3 inline-flex min-h-10 w-full items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-950 to-teal-900 px-3.5 text-left text-xs font-black text-white shadow-md transition hover:-translate-y-0.5"
                      >
                        <ShoppingBag size={15} aria-hidden="true" />
                        <span className="flex-1">
                          See {contextProducts.length} products picked for you
                        </span>
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex flex-col items-end gap-1">
                      <p
                        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-slate-950 px-4 py-2.5 text-sm leading-6 text-white shadow-sm ${m.stopped ? "opacity-60" : ""}`}
                      >
                        {m.text}
                      </p>
                      {m.stopped && (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Stopped
                        </span>
                      )}
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-2.5">
                      <AssistantAvatar />
                      <div className="min-w-0 max-w-[85%] break-words rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                        {m.thoughts?.length > 0 && (
                          <ThinkingSteps
                            id={`${panelId}-thoughts-${m.id}`}
                            steps={m.thoughts}
                            expanded={Boolean(expanded[m.id])}
                            onToggle={() =>
                              setExpanded((x) => ({ ...x, [m.id]: !x[m.id] }))
                            }
                          />
                        )}
                        <AssistantReply text={m.text} />
                        {m.id === latestAnswer?.id &&
                          !pending &&
                          !limit &&
                          followUps.length > 0 && (
                            <div className="mt-3">
                              <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                                Ask a follow-up
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {followUps.map((f) => (
                                  <button
                                    key={f}
                                    type="button"
                                    onClick={() => send(f)}
                                    className="min-h-9 rounded-full border border-emerald-200 bg-white px-3 text-left text-xs font-bold text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
                                  >
                                    {f}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        {m.id === latestAnswer?.id && !pending && (
                          <SupportNote question={latestAnswer.question} />
                        )}
                      </div>
                    </div>
                  ),
                )
              )}

              {pending && live && (
                <div className="flex gap-2.5">
                  <AssistantAvatar />
                  {!live.text && !(showThinking || live.thoughts.length) ? (
                    <TypingIndicator />
                  ) : (
                    <div className="min-w-0 max-w-[85%] flex-1 break-words rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                      <ThinkingSteps
                        id={`${panelId}-thoughts-live`}
                        steps={live.thoughts}
                        live={live.phase === "thinking"}
                        expanded={Boolean(expanded.live)}
                        onToggle={() =>
                          setExpanded((x) => ({ ...x, live: !x.live }))
                        }
                      />
                      {live.text && (
                        <p className="whitespace-pre-wrap">
                          {live.text}
                          <span
                            aria-hidden="true"
                            className="ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 rounded-sm bg-emerald-500 motion-safe:animate-pulse"
                          />
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && error.kind !== "invalid" && (
                <div
                  role="alert"
                  className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                  {error.partial && (
                    <p className="whitespace-pre-wrap text-slate-400">
                      {error.partial}
                    </p>
                  )}
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
              className={`flex-none border-t border-slate-200/70 bg-white/85 px-3 pb-3 pt-2.5 backdrop-blur-xl ${tab === "products" && contextProducts.length ? "hidden" : ""}`}
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              {limit && (
                <div
                  role="status"
                  className="mb-2.5 flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-3 text-sm text-emerald-950"
                >
                  <p className="font-bold leading-5">{limit.message}</p>
                  {limit.loginRequired ? (
                    <button
                      type="button"
                      onClick={openLogin}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-full bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800"
                    >
                      <LogIn size={14} aria-hidden="true" />
                      Log in for 5 questions a day
                    </button>
                  ) : (
                    <p className="text-xs font-semibold leading-5 text-emerald-800">
                      Come back after midnight.
                      {resetAt ? ` Questions reset at ${resetAt}.` : ""}
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-end gap-2 rounded-[1.35rem] border border-slate-200 bg-white p-1.5 pl-3.5 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-400/15">
                <label htmlFor={`${panelId}-input`} className="sr-only">
                  Message the AquaKart assistant
                </label>
                <textarea
                  id={`${panelId}-input`}
                  ref={inputRef}
                  rows={1}
                  value={input}
                  disabled={Boolean(limit)}
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
                  placeholder={
                    limit
                      ? "No questions left for today"
                      : "Ask about purifiers, softeners or your water…"
                  }
                  aria-invalid={error?.kind === "invalid" || tooLong}
                  aria-describedby={`${panelId}-hint`}
                  className="max-h-[132px] min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label={
                    pending && !canSend && !limit
                      ? "Waiting for the assistant"
                      : "Send message"
                  }
                  className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                >
                  {pending && !canSend && !limit ? (
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
                    {quota && (
                      <span
                        aria-live="polite"
                        className={`mb-0.5 block font-bold ${limit ? "text-rose-600" : "text-emerald-700"}`}
                      >
                        {quotaLabel(quota)}
                      </span>
                    )}
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
