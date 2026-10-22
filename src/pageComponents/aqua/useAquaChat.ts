"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INR } from "./catalogue";
import { uid } from "./hooks";
import type { ChatMessage, ChatStatus, Product } from "./types";

// Rule-based Aqua assistant ported from V4. It only produces messages: it never
// touches the flow machine. Chips that act (e.g. "Buy now") are handled by the UI.

type Need = "softener" | "purifier" | "filter" | "commercial";
type Req = {
  need?: Need;
  home?: "apartment";
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
};

export function useAquaChat({
  products,
  getCompare,
  clearCompare,
  reducedMotion,
}: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [happy, setHappy] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

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
  const messagesRef = useRef<ChatMessage[]>([]);
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

  const recommend = (r: Req) => {
    const need = r.need as Need;
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

  const compareNow = () => {
    const picked = compareRef.current.getCompare();
    const ids = (picked.length >= 2 ? picked : lastPicks.current).slice(0, 3);
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

  const discover = (t: string, sel?: Product) => {
    const r: Req = { ...req.current };
    const aw = r.awaiting;
    if (/soften|hard|scal|apartment|flat/.test(t)) r.need = "softener";
    else if (/purif|\bro\b|drinking/.test(t)) r.need = "purifier";
    else if (/commercial|hotel|office|industr|restaurant|hostel/.test(t))
      r.need = "commercial";
    else if (/filter/.test(t)) r.need = "filter";
    if (/apartment|flat/.test(t)) r.home = "apartment";
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
    if (/expert|human|call me|talk to|someone/.test(t)) return human();
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

  const send = useCallback(
    (raw: string, productId?: string | null) => {
      const text = raw.trim();
      if (!text) return false;
      settleNow();
      statusRef.current = "thinking";
      const tid = uid("t");
      pendingRef.current = { tid, text, productId };
      setMessages((ms) => [
        ...ms,
        { id: uid("u"), role: "user", text, productId: productId ?? null },
        { id: tid, role: "aqua", text: "", typing: true },
      ]);
      setStatus("thinking");
      timers.current.think = setTimeout(
        () => {
          pendingRef.current = null;
          setMessages((ms) => ms.filter((m) => m.id !== tid));
          route(text, productId);
        },
        rmRef.current ? 150 : 900,
      );
      return true;
    },
    // route/say read refs only, so a stable callback is safe here.
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
  const snapshot = (): ChatSession | null => {
    const ms = messagesRef.current;
    const first = ms.find((m) => m.role === "user");
    if (!first) return null;
    const done = ms
      .filter((m) => !m.typing)
      .map((m) => ({ ...m, text: m.full || m.text, done: true }));
    return { id: uid("s"), title: first.text, messages: done, at: Date.now() };
  };

  const clear = useCallback(() => {
    stopTimers();
    pendingRef.current = null;
    flushRef.current = null;
    const snap = snapshot();
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
      pendingRef.current = null;
      flushRef.current = null;
      const snap = snapshot();
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

  return {
    messages,
    status,
    reasons,
    happy,
    sessions,
    offerCode,
    send,
    say,
    post,
    cheer,
    onFirstView,
    clear,
    restore,
  };
}

export type AquaChat = ReturnType<typeof useAquaChat>;
