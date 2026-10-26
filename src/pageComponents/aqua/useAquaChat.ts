"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AI_HISTORY_MAX,
  AI_PROMPT_MAX,
  AiError,
  carryGuestQuota,
  deleteAiChat,
  updateAiChat,
  getAiChat,
  getAiQuota,
  getAiStatus,
  limitFromQuota,
  listAiChats,
  onTokenRejected,
  streamAiChat,
  type AiChatSummary,
  type AiLimit,
  type AiQuota,
  type AiSavedChat,
  type AiTurn,
} from "@/services/ai";
import { INR } from "./catalogue";
import { mentionedProducts } from "./replyProducts";
import { readHome, sizeSofteners, type Sizing } from "./softenerSizing";
import { uid } from "./hooks";
import type { ChatMessage, ChatStatus, Product } from "./types";

// Aqua's answers come from the AquaKart backend (POST /v1/ai/chat via
// services/ai). The hook only produces messages: it never touches the flow
// machine, and chips that act (e.g. "Buy now") are handled by the UI.
// Product cards are matched locally from the live catalogue, since the server
// returns text only and won't quote prices or stock. The rule-based engine
// below (ported from V4) is the fallback when /ai/status says the AI isn't
// configured.

export type AiMode = "checking" | "live" | "offline";

type Need = "softener" | "purifier" | "filter" | "commercial";
type Req = {
  need?: Need;
  home?: "apartment" | "house";
  bathrooms?: number;
  source?: "borewell" | "municipal" | "unsure";
  budget?: number;
  ppm?: number | "unknown";
  people?: number;
  awaiting?: "source" | "people" | "hardness" | null;
};
type Extra = Omit<Partial<ChatMessage>, "id" | "role" | "text"> & {
  happy?: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  at: number;
  // The account chat it was saved to, if any.
  sessionId?: string | null;
  pinned?: boolean;
};

// Successful exchanges in a transcript, in the server's history format.
const historyFrom = (ms: ChatMessage[]): AiTurn[] =>
  ms
    .filter(
      (m) =>
        !m.typing &&
        !m.error &&
        !m.stopped &&
        !m.unanswered &&
        (m.role === "user" || m.full || m.text),
    )
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      text: m.full || m.text,
    }))
    .slice(-AI_HISTORY_MAX);

// ---------- this tab's chats survive a refresh ----------
// sessionStorage, not localStorage: a refresh comes back to the chat on screen
// (and this visit's earlier ones), while a new tab or visit opens on a new chat.
// `owner` is the account the saved-chat ids belong to, so another login on this
// tab never continues someone else's conversation.
export const TAB_CHAT_KEY = "aqua.chat.tab";
type TabChats = {
  owner: string | null;
  active: ChatSession | null;
  sessions: ChatSession[];
};
const MAX_STORED_MESSAGES = 80;

const isMessage = (m: unknown): m is ChatMessage => {
  const o = m as ChatMessage | null;
  return (
    !!o &&
    typeof o.id === "string" &&
    (o.role === "user" || o.role === "aqua") &&
    typeof o.text === "string"
  );
};
const asSession = (v: unknown): ChatSession | null => {
  const o = v as ChatSession | null;
  if (!o || typeof o.id !== "string" || !Array.isArray(o.messages)) return null;
  const messages = o.messages.filter(isMessage);
  if (!messages.some((m) => m.role === "user")) return null;
  return {
    id: o.id,
    title: typeof o.title === "string" ? o.title : messages[0].text,
    messages,
    at: Number(o.at) || Date.now(),
    sessionId: typeof o.sessionId === "string" ? o.sessionId : null,
    pinned: o.pinned === true,
  };
};

export const readTabChats = (): TabChats => {
  const empty: TabChats = { owner: null, active: null, sessions: [] };
  try {
    const raw = window.sessionStorage.getItem(TAB_CHAT_KEY);
    if (!raw) return empty;
    const v = JSON.parse(raw) as Partial<TabChats>;
    return {
      owner: typeof v.owner === "string" ? v.owner : null,
      active: asSession(v.active),
      sessions: (Array.isArray(v.sessions) ? v.sessions : [])
        .map(asSession)
        .filter((x): x is ChatSession => !!x)
        .slice(0, 20),
    };
  } catch {
    return empty;
  }
};

const writeTabChats = (v: TabChats) => {
  try {
    if (!v.active && !v.sessions.length)
      window.sessionStorage.removeItem(TAB_CHAT_KEY);
    else window.sessionStorage.setItem(TAB_CHAT_KEY, JSON.stringify(v));
  } catch {
    // full or blocked storage: the chat just won't survive a refresh
  }
};

const NEED_LABEL: Record<Need, string> = {
  softener: "softeners",
  purifier: "purifiers",
  filter: "filters",
  commercial: "commercial systems",
};

export const ACTION_CHIPS = new Set(["Buy now"]);

type Options = {
  products: Product[];
  getCompare: () => string[];
  clearCompare: () => void;
  reducedMotion: boolean;
  // "Show thinking": send thinking: true and show the steps. Off = faster replies.
  thinking?: boolean;
  // Logged-in customer's token (5 questions a day); null for a guest (3 a day).
  token?: string | null;
  // The server rejected `token` (expired / another environment's): end the session.
  onSessionExpired?: () => void;
  // The signed-in customer's id; scopes the chats this tab keeps across a refresh.
  owner?: string | null;
  // The chat on screen came back after a refresh.
  onResumed?: () => void;
};

export function useAquaChat({
  products,
  getCompare,
  clearCompare,
  reducedMotion,
  thinking = true,
  token = null,
  onSessionExpired,
  owner = null,
  onResumed,
}: Options) {
  const authCallbacks = useRef({ onSessionExpired, onResumed });
  useEffect(() => {
    authCallbacks.current = { onSessionExpired, onResumed };
  }, [onSessionExpired, onResumed]);
  const thinkingRef = useRef(thinking);
  useEffect(() => {
    thinkingRef.current = thinking;
  }, [thinking]);
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  const ownerRef = useRef(owner);
  useEffect(() => {
    ownerRef.current = owner;
  }, [owner]);
  // What this tab had on screen before a refresh (read once, on mount).
  const [boot] = useState(readTabChats);
  // Account the restored saved-chat ids belong to, until the login is known.
  const bootOwnerRef = useRef(boot.owner);
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => boot.active?.messages || [],
  );
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [happy, setHappy] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(boot.sessions);
  const [aiMode, setAiMode] = useState<AiMode>("checking");

  // Successful turns only (what the server saw), oldest first. Failed turns never enter it.
  const aiHistory = useRef<AiTurn[]>(historyFrom(boot.active?.messages || []));
  const abortRef = useRef<AbortController | null>(null);
  const aiReady = useRef<Promise<boolean> | null>(null);
  useEffect(() => {
    let alive = true;
    aiReady.current = getAiStatus();
    aiReady.current.then((ok) => alive && setAiMode(ok ? "live" : "offline"));
    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, []);

  // Daily questions. Always the server's latest numbers: nothing is counted locally.
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [limit, setLimit] = useState<AiLimit | null>(null);
  const limitRef = useRef<AiLimit | null>(null);
  const applyQuota = useCallback((q: AiQuota | null, hit?: AiLimit) => {
    if (q) setQuota(q);
    const next = hit || (q ? limitFromQuota(q) : limitRef.current);
    limitRef.current = next;
    setLimit(next);
  }, []);
  // ---------- saved conversations (logged-in customers; guests aren't stored) ----------
  // The customer's saved conversation; null means the next answer starts one.
  const sessionIdRef = useRef<string | null>(boot.active?.sessionId ?? null);
  // Answers this tab got as a guest (per the server's quota tier). On login they
  // are carried into the account's daily count and the chat continues.
  const guestAnswersRef = useRef(0);
  const prevTokenRef = useRef<string | null>(token);

  // The account's saved conversations, most recent first (the history dock lists them).
  const [savedChats, setSavedChats] = useState<AiChatSummary[]>([]);
  const refreshSaved = async (tok: string) => {
    const list = await listAiChats(tok, { limit: 20 });
    if (tokenRef.current === tok) setSavedChats(list);
    return list;
  };

  // The server keeps only the text of a saved chat, so its product cards are
  // rebuilt when it opens: the cards this tab already showed for the same reply
  // (on screen or earlier this visit), else the products the reply names, else
  // the catalogue picks a live answer to that question would get.
  const showSaved = (chat: AiSavedChat) => {
    sessionIdRef.current = chat.id;
    aiHistory.current = chat.messages.slice(-AI_HISTORY_MAX);
    req.current = {};
    lastPicks.current = [];
    const shown = new Map<string, string[]>();
    for (const m of [
      ...messagesRef.current,
      ...sessionsRef.current.flatMap((x) => x.messages),
    ])
      if (m.role === "aqua" && m.products?.length)
        shown.set((m.full || m.text).trim(), m.products);
    let asked = "";
    setMessages(
      chat.messages.map((t): ChatMessage => {
        if (t.role === "user") {
          asked = t.text;
          return { id: uid("u"), role: "user", text: t.text };
        }
        const named = mentionedProducts(t.text, productsRef.current);
        const products =
          shown.get(t.text.trim()) ||
          (named.length ? named : catalogueMatches(asked, t.text, {}));
        if (products.length) lastPicks.current = products;
        return {
          id: uid("a"),
          role: "aqua",
          text: t.text,
          full: t.text,
          done: true,
          ai: true,
          products: products.length ? products : undefined,
          chips: products.length > 1 ? ["Compare these"] : undefined,
        };
      }),
    );
  };

  // On open and whenever the customer logs in or out (a login lifts the guest limit).
  useEffect(() => {
    const ctl = new AbortController();
    const was = prevTokenRef.current;
    prevTokenRef.current = token;
    // Saved chats belong to the account: a logout starts fresh, and so does
    // a different account signing in on a refreshed tab.
    if (!token) {
      if (was) dropAccountChats();
      setSavedChats([]);
    } else if (
      bootOwnerRef.current &&
      bootOwnerRef.current !== ownerRef.current
    )
      dropAccountChats();
    if (token) bootOwnerRef.current = null;
    (aiReady.current || getAiStatus()).then(async (live) => {
      if (!live || ctl.signal.aborted) return;
      // Logged in after chatting as a guest: keep this conversation (the next
      // answer saves it, earlier turns included) and count those questions.
      if (token && !was && guestAnswersRef.current > 0) {
        const carried = await carryGuestQuota(token);
        if (ctl.signal.aborted) return;
        guestAnswersRef.current = 0;
        applyQuota(
          carried ?? (await getAiQuota(token, { signal: ctl.signal })),
        );
        void refreshSaved(token);
        return;
      }
      const q = await getAiQuota(token, { signal: ctl.signal });
      if (ctl.signal.aborted) return;
      applyQuota(q);
      // The dock lists them; the chat on screen stays (a new visit opens on a new chat).
      if (token) void refreshSaved(token);
    });
    return () => ctl.abort();
    // dropAccountChats / refreshSaved read refs and setters only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, applyQuota]);

  // The chat on screen came back from before a refresh: tell the UI once.
  useEffect(() => {
    if (boot.active) authCallbacks.current.onResumed?.();
  }, [boot]);

  // The server rejected the current token: the UI ends the session (see onSessionExpired).
  useEffect(
    () =>
      onTokenRejected((rejected) => {
        if (rejected === tokenRef.current)
          authCallbacks.current.onSessionExpired?.();
      }),
    [],
  );

  const req = useRef<Req>({});
  const lastPicks = useRef<string[]>([]);
  const offerCode = useRef<string>("");
  const timers = useRef<{
    think?: ReturnType<typeof setTimeout>;
    stream?: ReturnType<typeof setInterval>;
    happy?: ReturnType<typeof setTimeout>;
  }>({});
  const productsRef = useRef(products);
  const rmRef = useRef(reducedMotion);
  const compareRef = useRef({ getCompare, clearCompare });
  const statusRef = useRef<ChatStatus>("idle");
  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => {
    productsRef.current = products;
    rmRef.current = reducedMotion;
    compareRef.current = { getCompare, clearCompare };
  }, [products, reducedMotion, getCompare, clearCompare]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const stopTimers = () => {
    clearTimeout(timers.current.think);
    clearInterval(timers.current.stream);
  };
  useEffect(
    () => () => {
      stopTimers();
      clearTimeout(timers.current.happy);
    },
    [],
  );

  // Short-lived "happy" droplet mood after a good answer, add-to-cart, etc.
  const cheer = useCallback((ms = 1800) => {
    clearTimeout(timers.current.happy);
    setHappy(true);
    timers.current.happy = setTimeout(() => setHappy(false), ms);
  }, []);

  const byId = (id?: string | null) =>
    id ? productsRef.current.find((p) => p.id === id) : undefined;

  // Completes the reply that is currently streaming (set by say()).
  const flushRef = useRef<(() => void) | null>(null);

  const say = useCallback(
    (full: string, extra: Extra = {}) => {
      const { happy, ...rest } = extra;
      const id = uid("a");
      flushRef.current?.();
      const done = () => {
        clearInterval(timers.current.stream);
        flushRef.current = null;
        setMessages((ms) =>
          ms.map((m) => (m.id === id ? { ...m, text: full, done: true } : m)),
        );
        statusRef.current = "idle";
        setStatus("idle");
        if (happy) cheer();
      };
      flushRef.current = done;
      setMessages((ms) => [
        ...ms,
        { id, role: "aqua", full, text: "", done: false, ...rest },
      ]);
      statusRef.current = "streaming";
      setStatus("streaming");
      if (rmRef.current) return done();
      const words = full.split(" ");
      let i = 0;
      clearInterval(timers.current.stream);
      timers.current.stream = setInterval(() => {
        i += 2;
        if (i >= words.length) return done();
        const t = words.slice(0, i).join(" ");
        setMessages((ms) =>
          ms.map((m) => (m.id === id ? { ...m, text: t } : m)),
        );
      }, 45);
    },
    [cheer],
  );

  // Immediate (non-streamed) message, used for system notes like the demo order notice.
  const post = useCallback((text: string, extra: Extra = {}) => {
    const { happy: _h, ...rest } = extra;
    void _h;
    setMessages((ms) => [
      ...ms,
      { id: uid("a"), role: "aqua", full: text, text, done: true, ...rest },
    ]);
  }, []);

  const addReasons = (r: Record<string, string>) =>
    setReasons((x) => ({ ...x, ...r }));

  // ---------- answers ----------
  const reasonFor = (p: Product, r: Req) => {
    const out: string[] = [];
    if (r.people && p.maxPeople)
      out.push(
        p.maxPeople >= r.people
          ? `Rated for up to ${p.maxPeople} people, covers your household of ${r.people}`
          : `Rated for ${p.maxPeople} people, smaller than your household of ${r.people}`,
      );
    if (typeof r.ppm === "number" && p.maxPpm)
      out.push(
        p.maxPpm >= r.ppm
          ? `handles up to ${p.maxPpm} ppm`
          : `rated for ${p.maxPpm} ppm, below your reading`,
      );
    if (r.budget)
      out.push(
        p.price <= r.budget
          ? `within your ${INR(r.budget)} budget`
          : `${INR(p.price - r.budget)} over budget`,
      );
    if (!out.length)
      out.push(
        p.capacity
          ? `Matches your need · ${p.capacity}`
          : "Matches your category. Sizing details are not listed, so ask me before buying",
      );
    const s = out.join(" · ");
    return s.charAt(0).toUpperCase() + s.slice(1) + ".";
  };

  const fit = (p: Product, r: Req) => {
    let f = 0;
    if (r.people && p.maxPeople)
      f +=
        p.maxPeople >= r.people
          ? p.maxPeople - r.people
          : 100 + (r.people - p.maxPeople) * 10;
    if (typeof r.ppm === "number" && p.maxPpm) f += p.maxPpm >= r.ppm ? 0 : 60;
    if (!p.inStock) f += 200;
    return f;
  };

  // Softeners for a sized home: whole-home automatic against per-bathroom units.
  const sizedSofteners = (r: Req): Sizing | null => {
    if (r.need !== "softener") return null;
    const sizing = sizeSofteners(productsRef.current, {
      bathrooms: r.bathrooms,
      kind: r.home,
    });
    if (!sizing) return null;
    addReasons(sizing.reasons);
    lastPicks.current = sizing.picks;
    return sizing;
  };
  const SIZED_CHIPS = [
    "Compare these",
    "Automatic or manual?",
    "Book a site visit",
  ];

  const recommend = (r: Req) => {
    const need = r.need as Need;
    const sized = sizedSofteners(r);
    if (sized)
      return say(sized.summary, {
        products: sized.picks,
        chips: SIZED_CHIPS,
        happy: true,
      });
    let pool = productsRef.current.filter((p) => p.cat === need);
    let over = false;
    if (r.budget) {
      const inB = pool.filter((p) => p.price <= r.budget!);
      if (inB.length) pool = inB;
      else over = true;
    }
    pool = pool
      .slice()
      .sort((a, b) => fit(a, r) - fit(b, r) || a.price - b.price);
    const picks = pool.slice(0, 3);
    if (!picks.length)
      return say(
        `I couldn't find ${NEED_LABEL[need]} in the catalogue right now. I can connect you with an Aquakart expert instead.`,
        {
          chips: ["Talk to an expert", "Show products under ₹25,000"],
        },
      );
    const rs: Record<string, string> = {};
    picks.forEach((p) => (rs[p.id] = reasonFor(p, r)));
    addReasons(rs);
    lastPicks.current = picks.map((p) => p.id);
    const ctx = [
      r.source === "borewell"
        ? "borewell"
        : r.source === "municipal"
          ? "municipal"
          : "",
      r.home === "apartment" ? "apartment" : "home",
    ]
      .filter(Boolean)
      .join(" ");
    let text = over
      ? `Nothing matches under ${INR(r.budget)} exactly, so here are the closest ${NEED_LABEL[need]}.`
      : `Here ${picks.length > 1 ? "are" : "is"} ${picks.length === 1 ? "one option" : "my top " + picks.length + " " + NEED_LABEL[need]} for your ${ctx}${r.people ? " of " + r.people : ""}.`;
    text += " Tap any product to see the full details.";
    const note =
      need === "softener" && (r.ppm === "unknown" || r.source === "unsure")
        ? "These are provisional. Without a hardness reading I can't confirm the sizing, so the installer should test your water before fitting."
        : undefined;
    say(text, {
      products: lastPicks.current,
      note,
      chips:
        picks.length > 1
          ? ["Compare these", "Talk to an expert"]
          : ["Talk to an expert"],
      happy: true,
    });
  };

  const budgetList = (r: Req) => {
    const pool = productsRef.current
      .filter((p) => p.price <= r.budget! && p.inStock)
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);
    if (!pool.length)
      return say(
        `I don't see anything in stock under ${INR(r.budget)} right now.`,
        { chips: ["Water softener", "RO purifier"] },
      );
    const rs: Record<string, string> = {};
    pool.forEach((p) => (rs[p.id] = `Within your ${INR(r.budget)} budget.`));
    addReasons(rs);
    lastPicks.current = pool.map((p) => p.id);
    say(
      `Here are ${pool.length} options under ${INR(r.budget)}. Tell me about your water and I'll narrow these down.`,
      {
        products: lastPicks.current,
        chips: [
          "Borewell water is hard",
          "I need drinking water",
          "Compare these",
        ],
        happy: true,
      },
    );
  };

  const commercial = () => {
    const picks = productsRef.current
      .filter((p) => p.cat === "commercial")
      .slice(0, 3);
    const rs: Record<string, string> = {};
    picks.forEach(
      (p) =>
        (rs[p.id] =
          "Closest catalogue match. Final sizing depends on your daily usage and flow rate."),
    );
    addReasons(rs);
    say(
      "Commercial systems are sized to your daily usage and flow rate, so an Aquakart expert should confirm the spec before you buy. Here's what's in the catalogue now.",
      {
        products: picks.map((p) => p.id),
        chips: ["Talk to an expert", "Show home softeners"],
      },
    );
  };

  const offerAnswer = (t: string) => {
    const cat = /purif|\bro\b/.test(t) ? "purifier" : "softener";
    const pool = productsRef.current
      .filter(
        (p) =>
          p.cat === cat &&
          p.inStock &&
          (cat === "purifier" || p.price >= 20000),
      )
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
    const code =
      cat === "purifier"
        ? "PURE10"
        : /install/.test(t)
          ? "FREEINSTALL"
          : "SEASON2K";
    offerCode.current = code;
    if (!pool.length)
      return say(
        "I couldn't find in-stock products for this offer right now.",
        { chips: ["Talk to an expert"] },
      );
    const rs: Record<string, string> = {};
    pool.forEach(
      (p) =>
        (rs[p.id] =
          `Eligible for ${code}. Final discount is confirmed at checkout.`),
    );
    addReasons(rs);
    lastPicks.current = pool.map((p) => p.id);
    say(
      `I've saved the ${code} offer for you, and it will be checked at checkout. These ${NEED_LABEL[cat]} qualify:`,
      {
        products: lastPicks.current,
        chips: ["Compare these", "Help me choose a water softener"],
        note: "Demo offers. In production, eligibility comes from an offers endpoint and the server applies the discount.",
        happy: true,
      },
    );
  };

  const human = () =>
    say(
      "I've noted your requirements for the Aquakart team, and an expert will call you to confirm the right system. You can keep browsing with me meanwhile.",
      {
        note: "Demo: in production this posts the conversation summary to the existing leads service.",
      },
    );

  const regenAnswer = () =>
    say(
      "An **automatic** softener regenerates by itself on a timer or after a set volume of water; you only top up the salt tank. A **manual** softener needs you to add salt and run the regeneration by hand at regular intervals. Manual units cost less but suit a single bathroom; for a whole home, automatic is far easier to live with.",
      {
        chips:
          lastPicks.current.length > 1
            ? ["Compare these", "Talk to an expert"]
            : ["Talk to an expert"],
      },
    );

  const compareNow = () => {
    const picked = compareRef.current.getCompare();
    const ids = (picked.length >= 2 ? picked : lastPicks.current).slice(0, 4);
    if (ids.length < 2)
      return say(
        "Pick at least two products with Compare and I will line them up.",
      );
    compareRef.current.clearCompare();
    say("Here they are side by side.", { table: ids });
  };

  const alternatives = (sel: Product) => {
    const pool = productsRef.current
      .filter((p) => p.cat === sel.cat && p.id !== sel.id && p.inStock)
      .sort(
        (a, b) => Math.abs(a.price - sel.price) - Math.abs(b.price - sel.price),
      )
      .slice(0, 3);
    if (!pool.length)
      return say(
        "There are no in-stock alternatives in this category right now. I can ask an expert to help.",
        { chips: ["Talk to an expert"] },
      );
    const rs: Record<string, string> = {};
    pool.forEach((p) => (rs[p.id] = reasonFor(p, req.current)));
    addReasons(rs);
    say(
      `${sel.title} is ${sel.stock.toLowerCase()}. These are the closest in-stock options.`,
      { products: pool.map((p) => p.id), happy: true },
    );
  };

  const productAnswer = (p: Product, t: string) => {
    const r = req.current;
    const missing = (what: string) =>
      `The ${what} for ${p.title} isn't listed in our product data, so I'd rather not guess. An Aquakart expert can confirm it.`;
    if (/capac|size|litre|liter|enough|people|family/.test(t)) {
      let a = p.capacity ? `${p.title} has ${p.capacity}` : missing("capacity");
      if (p.capacity && p.maxPeople)
        a +=
          `, rated for up to ${p.maxPeople} people` +
          (p.maxPpm ? ` and ${p.maxPpm} ppm hardness` : "");
      if (p.capacity) a += ".";
      if (r.people && p.maxPeople)
        a +=
          p.maxPeople >= r.people
            ? ` That covers your household of ${r.people}.`
            : ` That's smaller than your household of ${r.people}, so I'd look at a larger model.`;
      return say(a, { chips: ["Maintenance", "Installation", "Buy now"] });
    }
    if (/mainten|salt|regener|service|clean/.test(t))
      return say(p.maintenance || missing("maintenance schedule"), {
        chips: ["Installation", "Warranty"],
      });
    if (/install/.test(t))
      return say(p.install || missing("installation requirement"), {
        chips: ["Warranty", "Buy now"],
      });
    if (/warrant/.test(t))
      return say(
        p.warranty
          ? `${p.title} comes with a ${p.warranty} warranty.`
          : missing("warranty"),
        { chips: ["Buy now"] },
      );
    if (/price|cost|emi/.test(t))
      return say(
        `It's ${INR(p.price)}${p.mrp > p.price ? ", down from " + INR(p.mrp) : ""}. Shipping and taxes are calculated at checkout.`,
        { chips: ["Buy now"] },
      );
    if (/deliver|pin|ship/.test(t))
      return say(
        "Enter your PIN code in the delivery box on the product panel and I will check it.",
      );
    if (/buy|order|checkout/.test(t))
      return say(
        `Tap Buy now when you're ready and checkout opens next to this chat for ${p.title}.`,
        { chips: ["Buy now"] },
      );
    say(
      "This is one of the options we discussed. Would you like me to explain its capacity, maintenance or installation requirements?",
      {
        chips: ["Capacity", "Maintenance", "Installation"],
      },
    );
  };

  // Reads what the customer has told us (need, source, budget, hardness, household)
  // into req. Used by both the AI path (to rank catalogue cards) and the fallback.
  const updateReq = (t: string): Req => {
    const r: Req = { ...req.current };
    const aw = r.awaiting;
    if (/soften|hard|scal|apartment|flat/.test(t)) r.need = "softener";
    else if (/purif|\bro\b|drinking/.test(t)) r.need = "purifier";
    else if (/commercial|hotel|office|industr|restaurant|hostel/.test(t))
      r.need = "commercial";
    else if (/filter/.test(t)) r.need = "filter";
    const home = readHome(t);
    if (home.kind) r.home = home.kind;
    if (home.bathrooms) r.bathrooms = home.bathrooms;
    if (/borewell|bore well|ground ?water/.test(t)) r.source = "borewell";
    else if (/municipal|corporation|metro|tap water/.test(t))
      r.source = "municipal";
    else if (aw === "source" && /not sure|don|mix|both|tanker/.test(t))
      r.source = "unsure";
    const b = t.match(
      /(?:under|below|within|less than|up ?to)\s*(?:rs\.?|₹|inr)?\s*([\d,]+)\s*(k)?/,
    );
    if (b) r.budget = +b[1].replace(/,/g, "") * (b[2] ? 1000 : 1);
    const ppm = t.match(/(\d{2,4})\s*ppm/);
    if (aw === "hardness") {
      if (/don|not sure|no idea|unknown|skip/.test(t)) r.ppm = "unknown";
      else if (/below|under/.test(t)) r.ppm = 280;
      else if (/above|over/.test(t)) r.ppm = 1000;
      else if (ppm) r.ppm = +ppm[1];
      else if (/300.?700/.test(t)) r.ppm = 500;
    } else if (ppm) r.ppm = +ppm[1];
    const ppl =
      t.match(/(\d+)\s*\+?\s*(?:people|persons|members|of us)/) ||
      (aw === "people" ? t.match(/(\d+)(?!.*\d)/) : null);
    if (ppl) r.people = /\+/.test(t) ? +ppl[1] + 1 : +ppl[1];
    r.awaiting = null;
    req.current = r;
    return r;
  };

  const discover = (t: string, sel?: Product) => {
    const r = updateReq(t);

    if (r.need === "commercial") return commercial();
    if (!r.need && r.budget) return budgetList(r);
    if (!r.need) {
      if (sel) return productAnswer(sel, "");
      return say("Happy to help! What are you shopping for today?", {
        chips: [
          "Water softener",
          "RO purifier",
          "Whole-home filter",
          "Commercial solution",
        ],
      });
    }
    // Bathrooms are enough to size a softener; the water source and household
    // size can wait (the summary still asks for a hardness test).
    if (r.need === "softener" && (r.bathrooms || r.home === "house"))
      return recommend(r);
    if (!r.source) {
      req.current.awaiting = "source";
      return say(
        "Of course! 💧 Let's find one that fits. Are you using borewell water or municipal water?",
        { chips: ["Borewell", "Municipal", "A mix / not sure"] },
      );
    }
    if (r.need === "softener" && !r.people) {
      req.current.awaiting = "people";
      return say(
        "Got it! Do you know your water hardness, and roughly how many people use the water?",
        { chips: ["1–2 people", "3–4 people", "5–6 people", "7+ people"] },
      );
    }
    if (r.need === "softener" && r.ppm == null) {
      req.current.awaiting = "hardness";
      return say(
        "Thanks. And the hardness? A reading from a test strip or lab report works.",
        {
          chips: [
            "Below 300 ppm",
            "300–700 ppm",
            "Above 700 ppm",
            "I don't know",
          ],
        },
      );
    }
    recommend(r);
  };

  const route = (text: string, productId?: string | null) => {
    const t = text.toLowerCase();
    const sel = byId(productId);
    if (
      /offer|festive|discount|deal|free install/.test(t) &&
      !/compare/.test(t)
    )
      return offerAnswer(t);
    if (/expert|human|call me|talk to|someone|site visit/.test(t))
      return human();
    if (
      /automatic or manual|manual or automatic|(automatic|manual) vs|difference/.test(
        t,
      ) &&
      /automatic|manual/.test(t)
    )
      return regenAnswer();
    if (/^compare|compare these|compare picks/.test(t)) return compareNow();
    if (sel && /altern|similar|other option/.test(t)) return alternatives(sel);
    if (
      sel &&
      /capac|size|litre|liter|enough|people|family|mainten|salt|regener|service|clean|install|warrant|price|cost|emi|deliver|pin|ship|buy|order|checkout/.test(
        t,
      )
    )
      return productAnswer(sel, t);
    discover(t, sel);
  };

  // ---------- backend AI ----------
  // When a product is open, the question is about it. The server owns the system
  // prompt; this is just context in the user's own message.
  const contextLine = (p: Product) =>
    `I'm looking at "${p.title}"${p.capacity ? ` (${p.capacity})` : ""} on AquaKart.`;

  const SHOPPING =
    /recommend|suggest|which|best|choose|looking for|need (a|an|to)|buy|options?|show me|under|budget|for (my|a) (home|family|house|flat|apartment)|villa|bathroom|washroom|independent house|duplex/;
  const NAMED = /soften|purifier|\bro\b|filter|commercial/;
  const categoryOf = (s: string): Need | null =>
    /soften|hard ?water|hardness|scal/.test(s)
      ? "softener"
      : /purif|\bro\b|drinking|tds/.test(s)
        ? "purifier"
        : /commercial|hotel|restaurant|hostel|industr/.test(s)
          ? "commercial"
          : /filter/.test(s)
            ? "filter"
            : null;

  // Cards for shopping questions, from the live catalogue (the AI won't quote stock).
  const catalogueMatches = (text: string, reply: string, r: Req): string[] => {
    const t = text.toLowerCase();
    if (!SHOPPING.test(t) && !NAMED.test(t)) return [];
    const need =
      categoryOf(t) || categoryOf(reply.toLowerCase()) || r.need || null;
    if (need === "softener") {
      const sized = sizedSofteners({ ...r, need });
      if (sized) return sized.picks;
    }
    let pool = productsRef.current.filter(
      (p) => (need ? p.cat === need : !!r.budget) && p.inStock,
    );
    if (r.budget) {
      const inBudget = pool.filter((p) => p.price <= r.budget!);
      if (inBudget.length) pool = inBudget;
    }
    const picks = pool
      .slice()
      .sort((a, b) => fit(a, r) - fit(b, r) || a.price - b.price)
      .slice(0, 3);
    if (!picks.length) return [];
    const rs: Record<string, string> = {};
    picks.forEach((p) => (rs[p.id] = reasonFor(p, r)));
    addReasons(rs);
    lastPicks.current = picks.map((p) => p.id);
    return lastPicks.current;
  };

  const settle = () => {
    statusRef.current = "idle";
    setStatus("idle");
  };

  // The answer in flight: its bubble and the question it answers.
  const liveRef = useRef<{ tid: string; userId: string | null } | null>(null);

  const patch = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
    setMessages((ms) => ms.map((m) => (m.id === id ? fn(m) : m)));

  // Stops the answer in flight (a newer message replaces it). The question stays,
  // marked as stopped, and is left out of the history.
  const stopLive = () => {
    const live = liveRef.current;
    if (!abortRef.current || !live) return;
    abortRef.current.abort();
    abortRef.current = null;
    liveRef.current = null;
    setMessages((ms) =>
      ms
        .filter((m) => m.id !== live.tid)
        .map((m) => (m.id === live.userId ? { ...m, stopped: true } : m)),
    );
    settle();
  };

  // Streams the answer from POST /ai/chat/stream into the bubble `tid`:
  // thought → steps (upserted by index), delta → typed text, done → final reply.
  const askAi = async (
    text: string,
    productId: string | null | undefined,
    tid: string,
    userId: string | null,
  ) => {
    const sel = byId(productId);
    const r = updateReq(text.toLowerCase());
    const context = sel ? `${contextLine(sel)} ` : "";
    const prompt = (context + text).slice(0, AI_PROMPT_MAX);
    const thinking = thinkingRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    liveRef.current = { tid, userId };
    const current = () => abortRef.current === controller;
    let typed = "";

    if (thinking)
      patch(tid, (m) => ({
        ...m,
        typing: false,
        done: false,
        text: "",
        thoughts: [],
        thinkingLive: true,
      }));

    try {
      const answer = await streamAiChat(prompt, aiHistory.current, {
        signal: controller.signal,
        thinking,
        token: tokenRef.current,
        sessionId: sessionIdRef.current,
        onThought: (index, thought) => {
          if (!current()) return;
          patch(tid, (m) => {
            const thoughts = [...(m.thoughts || [])];
            thoughts[index] = thought;
            return { ...m, typing: false, thoughts };
          });
        },
        onDelta: (chunk) => {
          if (!current()) return;
          typed += chunk;
          if (statusRef.current !== "streaming") {
            statusRef.current = "streaming";
            setStatus("streaming");
          }
          // First answer text collapses the steps into "Thought for N steps".
          patch(tid, (m) => ({
            ...m,
            typing: false,
            thinkingLive: false,
            text: typed,
            done: false,
          }));
        },
      });
      if (!current()) return;
      applyQuota(answer.quota);
      // Saved to the account (logged in), or counted as a guest answer for a later login.
      if (answer.sessionId) {
        const isNew = answer.sessionId !== sessionIdRef.current;
        sessionIdRef.current = answer.sessionId;
        const tok = tokenRef.current;
        if (isNew && tok) void refreshSaved(tok);
        else
          // Same chat: move it to the top with its new count, no refetch.
          setSavedChats((list) => {
            const row = list.find((s) => s.id === answer.sessionId);
            if (!row) return list;
            const next = {
              ...row,
              messageCount: row.messageCount + 2,
              lastMessageAt: new Date().toISOString(),
            };
            return [next, ...list.filter((s) => s !== row)];
          });
      }
      if (answer.quota?.tier === "guest") guestAnswersRef.current += 1;
      // Only { role, text: reply } goes back as history, never the thoughts.
      aiHistory.current = [
        ...aiHistory.current,
        { role: "user" as const, text: prompt },
        { role: "assistant" as const, text: answer.reply },
      ].slice(-AI_HISTORY_MAX);
      // Products the answer writes about by name come first, so the cards match
      // the text; otherwise ranked catalogue picks for shopping questions.
      const named = sel
        ? []
        : mentionedProducts(answer.reply, productsRef.current);
      if (named.length) lastPicks.current = named;
      // A sized home gets the sized softeners too (after any the answer names), so
      // whole-home and per-bathroom options are always there to compare.
      const lt = text.toLowerCase();
      const sized =
        sel || !(SHOPPING.test(lt) || NAMED.test(lt))
          ? null
          : sizedSofteners({ ...r, need: categoryOf(lt) || r.need });
      const picks = sel
        ? []
        : sized
          ? [...new Set([...named, ...sized.picks])].slice(0, 4)
          : named.length
            ? named
            : catalogueMatches(text, answer.reply, r);
      if (sized) lastPicks.current = picks;
      patch(tid, (m) => ({
        ...m,
        typing: false,
        thinkingLive: false,
        text: answer.reply,
        full: answer.reply,
        done: true,
        ai: true,
        thoughts: answer.thoughts.length ? answer.thoughts : undefined,
        products: picks.length ? picks : undefined,
        chips: sel
          ? sel.inStock
            ? ["Capacity", "Maintenance", "Buy now"]
            : ["Show alternatives"]
          : sized
            ? SIZED_CHIPS
            : picks.length > 1
              ? ["Compare these"]
              : undefined,
      }));
      settle();
      if (picks.length) cheer();
    } catch (e) {
      const err =
        e instanceof AiError
          ? e
          : new AiError("unavailable", "Assistant is unavailable right now.");
      if (err.kind === "aborted" || !current()) return;
      if (err.kind === "daily_limit") {
        // Nothing was answered: the question stays on screen, marked, and out of history.
        setMessages((ms) =>
          ms
            .filter((m) => m.id !== tid)
            .map((m) => (m.id === userId ? { ...m, unanswered: true } : m)),
        );
        applyQuota(err.quota ?? null, {
          message: err.message,
          loginRequired: !!err.loginRequired,
        });
        settle();
        return;
      }
      patch(tid, () => ({
        id: tid,
        role: "aqua",
        text: err.message,
        full: err.message,
        done: true,
        error: true,
        partial: err.partial || typed || undefined,
        // 429 and 5xx can be retried with the same words; 400/422 need a new message.
        retry:
          err.retryable || err.kind === "rate_limited"
            ? { text, productId: productId ?? null }
            : undefined,
      }));
      settle();
    } finally {
      if (current()) {
        abortRef.current = null;
        liveRef.current = null;
      }
    }
  };

  // ---------- public API ----------
  const pendingRef = useRef<{
    tid: string;
    text: string;
    productId?: string | null;
  } | null>(null);

  // Lets a new message interrupt: the pending answer is produced and completed at once,
  // so the transcript keeps its order and the composer never blocks.
  const settleNow = () => {
    const p = pendingRef.current;
    if (statusRef.current === "thinking" && p) {
      clearTimeout(timers.current.think);
      pendingRef.current = null;
      setMessages((ms) => ms.filter((m) => m.id !== p.tid));
      route(p.text, p.productId);
    }
    flushRef.current?.();
  };

  // Compare is a UI action on cards already shown, not a question for the model.
  const isLocalCommand = (t: string) =>
    /^compare|compare these|compare picks/.test(t.toLowerCase());

  const send = useCallback(
    (raw: string, productId?: string | null) => {
      const text = raw.trim();
      if (!text) return false;
      // Out of questions for today: keep the draft, ask nothing.
      if (limitRef.current && !isLocalCommand(text)) return false;
      // A new message stops the answer still streaming.
      stopLive();
      settleNow();
      statusRef.current = "thinking";
      const tid = uid("t");
      const userId = uid("u");
      setMessages((ms) => [
        ...ms,
        { id: userId, role: "user", text, productId: productId ?? null },
        { id: tid, role: "aqua", text: "", typing: true },
      ]);
      setStatus("thinking");

      const local = () => {
        pendingRef.current = { tid, text, productId };
        timers.current.think = setTimeout(
          () => {
            pendingRef.current = null;
            setMessages((ms) => ms.filter((m) => m.id !== tid));
            route(text, productId);
          },
          rmRef.current ? 150 : 900,
        );
      };

      if (isLocalCommand(text)) local();
      else
        (aiReady.current || getAiStatus()).then((live) => {
          if (statusRef.current !== "thinking") return; // cleared meanwhile
          if (live) askAi(text, productId, tid, userId);
          else local();
        });
      return true;
    },
    // route/say/askAi read refs only, so a stable callback is safe here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // "Try again" on a failed answer: same words, no second user bubble.
  const retry = useCallback(
    (messageId: string) => {
      const failed = messagesRef.current.find((m) => m.id === messageId);
      if (!failed?.retry || abortRef.current || statusRef.current !== "idle")
        return;
      const { text, productId } = failed.retry;
      const tid = uid("t");
      statusRef.current = "thinking";
      setStatus("thinking");
      setMessages((ms) => [
        ...ms.filter((m) => m.id !== messageId),
        { id: tid, role: "aqua", text: "", typing: true },
      ]);
      askAi(text, productId, tid, null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Follow-up when a product is opened for the first time in a conversation.
  const onFirstView = useCallback(
    (p: Product) => {
      if (statusRef.current !== "idle") return;
      if (p.inStock)
        say(
          "This is one of the options we discussed. Would you like me to explain its capacity, maintenance or installation requirements?",
          {
            chips: ["Capacity", "Maintenance", "Installation"],
          },
        );
      else
        say(
          `${p.title} is ${p.stock.toLowerCase()} at the moment. Want me to find the closest alternatives?`,
          { chips: ["Show alternatives"] },
        );
    },
    [say],
  );

  // Snapshot of the current conversation for the history dock, or null if it has no user turn.
  // Name and pin of the this-visit chat on screen (set when one is reopened), so
  // a renamed or pinned chat keeps both when it goes back into the list.
  const localMetaRef = useRef<{ title?: string; pinned?: boolean }>({
    title: boot.active?.title,
    pinned: boot.active?.pinned,
  });
  const snapshot = (): ChatSession | null => {
    const ms = messagesRef.current;
    const first = ms.find((m) => m.role === "user");
    if (!first) return null;
    const done = ms
      .filter((m) => !m.typing)
      .map((m) => ({ ...m, text: m.full || m.text, done: true }));
    return {
      id: uid("s"),
      title: localMetaRef.current.title || first.text,
      messages: done,
      at: Date.now(),
      sessionId: sessionIdRef.current,
      pinned: localMetaRef.current.pinned,
    };
  };

  // Keeps this tab's chats in sessionStorage whenever an answer settles (not on
  // every streamed chunk), so a refresh lands back on the same conversation.
  const sessionsRef = useRef(sessions);
  const persistTab = () => {
    const snap = snapshot();
    const active = snap && {
      ...snap,
      messages: snap.messages.slice(-MAX_STORED_MESSAGES),
    };
    const list = sessionsRef.current;
    const hasAccountIds = !!active?.sessionId || list.some((x) => x.sessionId);
    writeTabChats({
      owner: hasAccountIds ? ownerRef.current : null,
      active,
      sessions: list,
    });
  };
  useEffect(() => {
    sessionsRef.current = sessions;
    if (status === "idle") persistTab();
    // persistTab reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, sessions, status]);

  // Signed out (or another account): the chats on screen stay, but stop saving
  // to the old account; the next answer starts a new saved conversation.
  const dropAccountChats = () => {
    sessionIdRef.current = null;
    bootOwnerRef.current = null;
    const strip = (list: ChatSession[]) =>
      list.some((x) => x.sessionId)
        ? list.map((x) => ({ ...x, sessionId: null }))
        : list;
    sessionsRef.current = strip(sessionsRef.current);
    setSessions(strip);
    persistTab();
  };

  const clear = useCallback(() => {
    stopTimers();
    abortRef.current?.abort();
    abortRef.current = null;
    liveRef.current = null;
    aiHistory.current = [];
    const snap = snapshot();
    localMetaRef.current = {};
    // New chat: the next answer starts a new saved conversation.
    sessionIdRef.current = null;
    pendingRef.current = null;
    flushRef.current = null;
    if (snap) setSessions((s) => [snap, ...s].slice(0, 20));
    setMessages([]);
    req.current = {};
    lastPicks.current = [];
    setStatus("idle");
    statusRef.current = "idle";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restore = useCallback(
    (id: string) => {
      const s = sessions.find((x) => x.id === id);
      if (!s) return;
      stopTimers();
      abortRef.current?.abort();
      abortRef.current = null;
      liveRef.current = null;
      aiHistory.current = historyFrom(s.messages);
      const snap = snapshot();
      localMetaRef.current = { title: s.title, pinned: s.pinned };
      // Keeps saving to the account chat it came from, if any.
      sessionIdRef.current = s.sessionId ?? null;
      pendingRef.current = null;
      flushRef.current = null;
      setSessions((list) => {
        const rest = list.filter((x) => x.id !== id);
        return snap ? [snap, ...rest] : rest;
      });
      setMessages(s.messages);
      req.current = {};
      setStatus("idle");
      statusRef.current = "idle";
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions],
  );

  // Opens a conversation saved to the account. The one on screen goes to this
  // tab's history unless it's saved too (then it's already in the list).
  const openSaved = useCallback(
    async (id: string) => {
      const tok = tokenRef.current;
      if (!tok) return false;
      const saved = await getAiChat(id, tok);
      if (!saved?.messages.length || tokenRef.current !== tok) return false;
      stopTimers();
      abortRef.current?.abort();
      abortRef.current = null;
      liveRef.current = null;
      pendingRef.current = null;
      flushRef.current = null;
      const snap = snapshot();
      localMetaRef.current = {};
      if (snap && !snap.sessionId)
        setSessions((s) => [snap, ...s].slice(0, 20));
      showSaved(saved);
      setStatus("idle");
      statusRef.current = "idle";
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Deletes a conversation saved to the account. If it's the one on screen, it
  // stays on screen and the next answer starts a new saved conversation.
  const deleteSaved = useCallback(async (id: string) => {
    const tok = tokenRef.current;
    if (!tok || !(await deleteAiChat(id, tok)) || tokenRef.current !== tok)
      return false;
    if (sessionIdRef.current === id) sessionIdRef.current = null;
    setSavedChats((list) => list.filter((s) => s.id !== id));
    // This tab's copies of it would otherwise resurface as "earlier this visit".
    setSessions((list) => list.filter((s) => s.sessionId !== id));
    return true;
  }, []);

  // Drops one of this visit's earlier chats (never saved, nothing to call).
  const deleteSession = useCallback((id: string) => {
    setSessions((list) => list.filter((s) => s.id !== id));
    return true;
  }, []);

  // Rename / pin a chat saved to the account: shown at once, saved to the
  // server, and put back if the server refuses. Resolves to whether it stuck.
  const updateSaved = useCallback(
    async (id: string, patch: { title?: string; pinned?: boolean }) => {
      const tok = tokenRef.current;
      let before: AiChatSummary | undefined;
      setSavedChats((list) =>
        list.map((s) => {
          if (s.id !== id) return s;
          before = s;
          return { ...s, ...patch };
        }),
      );
      const saved = await updateAiChat(id, patch, tok);
      if (tokenRef.current !== tok) return false;
      setSavedChats((list) =>
        list.map((s) =>
          s.id !== id ? s : saved ? { ...s, ...saved } : before || s,
        ),
      );
      return !!saved;
    },
    [],
  );
  const renameSaved = useCallback(
    (id: string, title: string) => updateSaved(id, { title }),
    [updateSaved],
  );
  const pinSaved = useCallback(
    (id: string, pinned: boolean) => updateSaved(id, { pinned }),
    [updateSaved],
  );

  // Same for this visit's earlier chats; nothing to save anywhere.
  const updateSession = useCallback(
    (id: string, patch: { title?: string; pinned?: boolean }) => {
      setSessions((list) =>
        list.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
      return true;
    },
    [],
  );
  const renameSession = useCallback(
    (id: string, title: string) => updateSession(id, { title }),
    [updateSession],
  );
  const pinSession = useCallback(
    (id: string, pinned: boolean) => updateSession(id, { pinned }),
    [updateSession],
  );

  // Title of the chat on screen (null on a new chat): the account's name for it
  // when saved (so a rename shows straight away), else the name it was reopened
  // with, else the first question.
  const firstAsk = messages.find((m) => m.role === "user");
  const title = firstAsk
    ? savedChats.find((s) => s.id === sessionIdRef.current)?.title ||
      localMetaRef.current.title ||
      firstAsk.text
    : null;

  return {
    messages,
    title,
    status,
    reasons,
    happy,
    sessions,
    offerCode,
    aiMode,
    quota,
    limit,
    send,
    retry,
    say,
    post,
    cheer,
    onFirstView,
    clear,
    restore,
    savedChats,
    openSaved,
    deleteSaved,
    deleteSession,
    renameSaved,
    pinSaved,
    renameSession,
    pinSession,
  };
}

export type AquaChat = ReturnType<typeof useAquaChat>;
