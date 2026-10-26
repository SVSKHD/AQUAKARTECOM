"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, X } from "lucide-react";
import type { Flow } from "@/utils/aquaFlow";
import logo from "@/assests/logo.png";
import { quotaLabel } from "@/services/ai";
import AquaAvatar from "./AquaAvatar";
import ArrowScroller from "./ArrowScroller";
import AquaDroplet from "./AquaDroplet";
import AquaLimitCard from "./AquaLimitCard";
import AquaReply from "./AquaReply";
import AquaThinking from "./AquaThinking";
import { INR } from "./catalogue";
import AquaSupportNote from "./AquaSupportNote";
import { suggestFollowUps } from "@/utils/aiFollowUps";
import Composer from "./Composer";
import CompareTable from "./CompareTable";
import HardnessCard from "./HardnessCard";
import ProductCard from "./ProductCard";
import ReplyActions from "./ReplyActions";
import WhileYouWait from "./WhileYouWait";
import { aquaConfig } from "./config";
import { useReducedMotion } from "./hooks";
import { ACTION_CHIPS, type AquaChat } from "./useAquaChat";
import type { ChatMessage, FlowDispatch, Mood, Product } from "./types";

// A reply's product cards in one horizontal row: arrows instead of a
// scrollbar, cards snap into place and the next one peeks in at the edge so
// the row reads as scrollable. Desktop shows ~3, phones ~2.
function ProductGrid({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: ReactNode;
}) {
  return (
    <ArrowScroller
      axis="x"
      wrapClassName="aq-cards-wrap"
      className={`aq-cards-row${isMobile ? " aq-cards-row-sm" : ""}`}
      label="products"
    >
      {children}
    </ArrowScroller>
  );
}

type Props = {
  flow: Flow;
  dispatch: FlowDispatch;
  chat: AquaChat;
  products: Map<string, Product>;
  mood: Mood;
  dark: boolean;
  userName: string | null;
  isMobile: boolean;
  panelOpen: boolean;
  selectedProduct: Product | null;
  favIds: string[];
  cartIds: string[];
  compare: string[];
  onOpen: (id: string) => void;
  onToggleFav: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onClearCompare: () => void;
  onAddToCart: (id: string) => void;
  onBuy: () => void;
  // productId: the product a question is about (a tagged reply's chips).
  onSend: (text: string, productId?: string | null) => boolean;
  // Opens Google sign-in; used by the daily-limit card.
  onSignIn: () => void;
  signingIn: boolean;
  signInError?: string;
  onFocusChange: (focused: boolean) => void;
  hideComposer: boolean;
  composerRef: (el: HTMLDivElement | null) => void;
  peekText: string;
  onPeekOpen: () => void;
  onPeekDismiss: () => void;
};

function FillLoader({ size = 26 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Aqua is thinking"
      style={{
        position: "relative",
        display: "block",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <img
        src={logo.src}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: 0.15,
          filter: "grayscale(1)",
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          clipPath: "inset(100% 0 0 0)",
          animation: "aqFill 1.25s cubic-bezier(.2,.7,.2,1) infinite",
        }}
      >
        <img
          src={logo.src}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </span>
    </span>
  );
}

// Always mounted, in every flow state. Messages, product cards and the compare table render inline.
export default function Conversation(p: Props) {
  const reduced = useReducedMotion();
  const isWelcome = p.flow.state === "welcome";
  const busy = p.chat.status !== "idle";
  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const firstName = (p.userName || "").trim().split(/\s+/)[0] || "";

  // The composer sits at the bottom on the welcome screen too, and is the same element
  // in the chat, so starting a conversation never moves or remounts it (no layout shift);
  // only its max-width eases out.
  const setCompRef = p.composerRef;

  // Keep the newest message in view unless the reader scrolled up. Instant scrolling on
  // purpose: smooth scrolling emits intermediate scroll events that would unstick it.
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || isWelcome) return;
    if (stickRef.current) el.scrollTop = el.scrollHeight;
  }, [p.chat.messages, isWelcome]);
  useLayoutEffect(() => {
    const el = listRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    // Panel opening, cards loading images, etc. change height without a new message.
    const ro = new ResizeObserver(() => {
      if (stickRef.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [isWelcome]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickRef.current = atBottom;
    setShowJump(!atBottom);
  };

  const onChip = (label: string, productId?: string | null) => {
    if (ACTION_CHIPS.has(label) && p.flow.state === "product") return p.onBuy();
    p.onSend(label, productId);
  };

  // The product a message is about, as a tappable pill (opens the product).
  const productTag = (id: string | null | undefined, onDark = false) => {
    const prod = id ? p.products.get(id) : undefined;
    if (!prod) return null;
    return (
      <button
        type="button"
        className="aq-ptag"
        data-dark={onDark}
        onClick={() => p.onOpen(prod.id)}
        title={`Open ${prod.title}`}
      >
        {prod.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- catalogue images on Cloudinary
          <img src={prod.photos[0]} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true" className="aq-ptag-ph" />
        )}
        <span className="aq-ptag-title">{prod.title}</span>
        <span className="aq-ptag-price">{INR(prod.price)}</span>
      </button>
    );
  };

  const placeholder =
    p.selectedProduct && p.flow.state === "product"
      ? `Ask about ${p.selectedProduct.title}…`
      : isWelcome
        ? "Ask Aqua anything…"
        : "Message Aqua…";

  const parked = p.flow.state === "chatting" && p.flow.parked;
  const msgMax = p.panelOpen ? 860 : 760;

  // The "confirm with support" note goes under the most recent AI answer only.
  const latestAi = (() => {
    const ms = p.chat.messages;
    for (let i = ms.length - 1; i >= 0; i -= 1) {
      if (ms[i].role !== "aqua" || ms[i].typing) continue;
      if (!ms[i].ai) return null;
      const asked = ms
        .slice(0, i)
        .reverse()
        .find((x) => x.role === "user");
      return {
        id: ms[i].id,
        question: asked?.text || "",
        reply: ms[i].full || ms[i].text,
        chips: ms[i].chips || [],
      };
    }
    return null;
  })();
  // Suggested next questions under the latest AI answer: never one already asked,
  // nor one of the answer's own action chips.
  const followUps = latestAi
    ? suggestFollowUps(latestAi.question, latestAi.reply, [
        ...p.chat.messages.filter((x) => x.role === "user").map((x) => x.text),
        ...latestAi.chips,
      ])
    : [];

  const renderMessage = (m: ChatMessage) => {
    if (m.role === "user")
      return (
        <div
          key={m.id}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div
            className="aq-btn-dark"
            style={{
              opacity: m.stopped ? 0.6 : 1,
              transformOrigin: "100% 100%",
              animation: "aqUserIn .42s cubic-bezier(.2,.8,.2,1) both",
              maxWidth: "80%",
              padding: "12px 16px",
              borderRadius: "20px 20px 6px 20px",
              fontSize: 15,
              lineHeight: 1.5,
              fontWeight: 500,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {m.productId && p.products.get(m.productId) && (
              <span className="aq-ptag-about">
                {productTag(m.productId, true)}
              </span>
            )}
            {m.text}
          </div>
          {m.stopped && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "var(--aq-mut2)",
              }}
            >
              Stopped
            </span>
          )}
          {m.unanswered && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "var(--aq-mut2)",
              }}
            >
              Not answered · daily limit reached
            </span>
          )}
        </div>
      );

    const cards = (m.products || [])
      .map((id) => p.products.get(id))
      .filter((x): x is Product => !!x);
    const table = (m.table || [])
      .map((id) => p.products.get(id))
      .filter((x): x is Product => !!x);
    const streaming = !m.done && !m.typing;
    // The whole answer stays in its bubble; every product it suggests follows
    // as a portrait card in a grid that grows downwards.
    const bubble = {
      borderRadius: "6px 20px 20px 20px",
      padding: "13px 18px",
      fontSize: 15,
      lineHeight: 1.58,
      maxWidth: "100%",
      textWrap: "pretty",
      overflowWrap: "anywhere",
    } as const;
    return (
      <div
        key={m.id}
        style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
      >
        <div
          style={{
            width: 30,
            flexShrink: 0,
            paddingTop: 2,
            animation: "aqChipIn .4s cubic-bezier(.2,.8,.2,1) both",
          }}
        >
          <AquaAvatar size={28} />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "flex-start",
            animation: "aqAquaIn .5s cubic-bezier(.2,.8,.2,1) both",
          }}
        >
          {m.typing ? (
            <div
              className="aq-card"
              style={{
                borderRadius: "6px 20px 20px 20px",
                padding: "10px 16px 10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <FillLoader />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--aq-mut)",
                  whiteSpace: "nowrap",
                }}
              >
                Looking through the catalogue
              </span>
            </div>
          ) : m.error ? (
            <div
              role="alert"
              style={{
                borderRadius: "6px 20px 20px 20px",
                padding: "12px 16px",
                fontSize: 14,
                lineHeight: 1.5,
                maxWidth: "100%",
                background: "#FDECEC",
                border: "1px solid #F5C2C2",
                color: "#8A1F1F",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              {m.partial && (
                <span
                  style={{ whiteSpace: "pre-wrap", color: "var(--aq-mut2)" }}
                >
                  {m.partial}
                </span>
              )}
              <span style={{ fontWeight: 600 }}>{m.text}</span>
              {m.retry && (
                <button
                  type="button"
                  className="aq-btn"
                  onClick={() => p.chat.retry(m.id)}
                  disabled={busy}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    fontSize: 12.5,
                    background: "#B42318",
                    color: "#fff",
                  }}
                >
                  Try again
                </button>
              )}
            </div>
          ) : (
            (m.text || m.thoughts || m.thinkingLive) && (
              <div
                className="aq-card"
                style={{
                  ...bubble,
                  width: m.thinkingLive ? "100%" : undefined,
                }}
              >
                {m.productId && (
                  <div style={{ marginBottom: 8 }}>
                    {productTag(m.productId)}
                  </div>
                )}
                {(m.thoughts || m.thinkingLive) && (
                  <AquaThinking steps={m.thoughts} live={!!m.thinkingLive} />
                )}
                {/* Plain text while streaming (no half-parsed markdown), formatted once complete. */}
                {m.text &&
                  (streaming ? m.text : <AquaReply text={m.full || m.text} />)}
                {streaming && m.text && (
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      marginLeft: 5,
                      borderRadius: "50% 0 50% 50%",
                      transform: "rotate(-45deg)",
                      background: "#10BFA4",
                      verticalAlign: "middle",
                      animation: "aqCaret .7s ease-in-out infinite",
                    }}
                  />
                )}
              </div>
            )
          )}
          {/* Slow answer: blog reads to read or listen to meanwhile. */}
          <WhileYouWait waiting={!m.done && !m.error && !m.text} />
          {m.done && m.note && (
            <div
              style={{
                background: "rgba(255,248,236,.95)",
                border: "1px solid #F2E2C2",
                color: "#5C4413",
                padding: "10px 14px",
                borderRadius: 14,
                fontSize: 13,
                lineHeight: 1.5,
                maxWidth: "100%",
              }}
            >
              {m.note}
            </div>
          )}
          {m.done && cards.length > 0 && (
            <ProductGrid isMobile={p.isMobile}>
              {cards.map((c, i) => (
                <ProductCard
                  key={c.id}
                  product={c}
                  delay={i * 0.08}
                  compact={p.isMobile}
                  reason={p.chat.reasons[c.id]}
                  selected={p.panelOpen && p.flow.productId === c.id}
                  isFav={p.favIds.includes(c.id)}
                  inCart={p.cartIds.includes(c.id)}
                  inCompare={p.compare.includes(c.id)}
                  onOpen={p.onOpen}
                  onToggleFav={p.onToggleFav}
                  onToggleCompare={p.onToggleCompare}
                  onAddToCart={p.onAddToCart}
                />
              ))}
            </ProductGrid>
          )}
          {m.done && table.length > 1 && (
            <CompareTable products={table} onOpen={p.onOpen} />
          )}
          {m.done && m.chips && m.chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {m.chips.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className="aq-chip"
                  onClick={() => onChip(c, m.productId)}
                  style={{
                    animation: `aqChipIn .4s cubic-bezier(.2,.8,.2,1) ${i * 0.05}s both`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {m.ai &&
            m.done &&
            m.id === latestAi?.id &&
            !p.chat.limit &&
            followUps.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="aq-label" style={{ fontSize: 10.5 }}>
                  Ask a follow-up
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {followUps.map((f, i) => (
                    <button
                      key={f}
                      type="button"
                      className="aq-chip aq-chip-soft"
                      onClick={() => p.onSend(f)}
                      style={{
                        // Long questions wrap on narrow phones instead of running off the edge.
                        whiteSpace: "normal",
                        textAlign: "left",
                        maxWidth: "100%",
                        lineHeight: 1.35,
                        animation: `aqChipIn .4s cubic-bezier(.2,.8,.2,1) ${0.1 + i * 0.05}s both`,
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          {m.done && !m.error && (m.full || m.text) && (
            <ReplyActions id={m.id} text={m.full || m.text} />
          )}
          {m.ai && m.done && m.id === latestAi?.id && (
            <AquaSupportNote question={latestAi.question} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        ref={listRef}
        onScroll={onScroll}
        className="aq-noscroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px 12px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isWelcome ? (
          // margin:auto (not justify-content:center) keeps an overflowing hero scrollable.
          <div
            style={{
              margin: "auto 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              textAlign: "center",
              padding: "8px 0 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{ height: 46, display: "flex", alignItems: "flex-end" }}
              >
                <div
                  className="aq-glass aq-bubble-tail"
                  style={{
                    position: "relative",
                    padding: "9px 18px",
                    borderRadius: 18,
                    fontSize: 14,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "visible",
                    transformOrigin: "50% 100%",
                    animation:
                      "aqGreetIn .85s cubic-bezier(.2,1.5,.4,1) both, aqGreetFloat 4.5s ease-in-out .85s infinite",
                  }}
                >
                  {firstName
                    ? `Welcome back, ${firstName}! 👋`
                    : "Hi, I'm Aqua 👋"}
                </div>
              </div>
              <div
                style={{
                  position: "relative",
                  display: "grid",
                  placeItems: "center",
                  width: 240,
                  height: "clamp(120px, 21vh, 190px)",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    width: 260,
                    height: 260,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(16,191,164,.22) 0%, rgba(118,206,240,.08) 45%, rgba(16,191,164,0) 70%)",
                  }}
                />
                <AquaDroplet
                  mood={p.mood}
                  size={p.isMobile ? 116 : 150}
                  dark={p.dark}
                  label="Aqua, the Aquakart assistant"
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: 660,
              }}
            >
              <h1
                className="aq-display"
                style={{
                  margin: 0,
                  fontSize: p.isMobile ? 25 : "clamp(28px, 3.4vw, 40px)",
                  lineHeight: p.isMobile ? 1.22 : 1.15,
                  fontWeight: 700,
                  letterSpacing: p.isMobile ? "-0.02em" : "-0.03em",
                  textWrap: "balance",
                }}
              >
                {/* On phones the bubble above already greets by name. */}
                {p.isMobile
                  ? "What can I find for you today?"
                  : firstName
                    ? `Welcome back, ${firstName}. What can I find for you today?`
                    : "Hi, I'm Aqua. What can I find for you today?"}{" "}
                <span aria-hidden="true">💧</span>
              </h1>
              <p
                style={{
                  margin: "0 auto",
                  maxWidth: 620,
                  fontSize: p.isMobile ? 14 : "clamp(15px, 1.4vw, 17px)",
                  lineHeight: 1.6,
                  color: "var(--aq-body)",
                  textWrap: "pretty",
                }}
              >
                {firstName
                  ? "This is a new chat. Your earlier chats are in History: open one to pick up where you left off, or ask me something new."
                  : "Tell me about your water and your home. I'll suggest what fits, and you can buy without leaving this chat."}
              </p>
            </div>
            <HardnessCard onAsk={p.onSend} compact={p.isMobile} />
            <div
              data-tour="suggestions"
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 10,
                maxWidth: 720,
              }}
            >
              {aquaConfig.suggestionChips.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className="aq-chip aq-chip-soft"
                  onClick={() => p.onSend(c)}
                  style={{
                    fontSize: 13.5,
                    padding: "8px 16px",
                    minHeight: 38,
                    animation: `aqChipIn .4s cubic-bezier(.2,.8,.2,1) ${0.2 + i * 0.06}s both`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            {aquaConfig.showFestive && (
              <button
                type="button"
                className="aq-card"
                onClick={() => p.onSend("Show offers on water softeners")}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  color: "var(--aq-ink)",
                  textAlign: "left",
                  maxWidth: 560,
                  width: "100%",
                }}
              >
                <strong style={{ display: "block", fontSize: 15 }}>
                  Seasonal offers
                </strong>
                <span style={{ fontSize: 12.5, color: "var(--aq-mut)" }}>
                  Ask Aqua which products qualify. Discounts are confirmed by
                  the server at checkout.
                </span>
              </button>
            )}
            {aquaConfig.showTrust && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  justifyContent: "center",
                  fontSize: 12.5,
                  color: "var(--aq-mut)",
                  fontWeight: 600,
                }}
              >
                <span>Payments through PhonePe</span>
                <span>Downloadable invoices</span>
                <span>Experts on WhatsApp</span>
              </div>
            )}
          </div>
        ) : (
          <div
            ref={contentRef}
            style={{
              width: "100%",
              maxWidth: msgMax,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {p.chat.messages.map(renderMessage)}
          </div>
        )}
      </div>

      <div
        ref={setCompRef}
        style={{
          padding: "6px 0 4px",
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Anchored to the composer's top edge, so it never covers the text
            box however tall the composer stack gets. */}
        {showJump && !isWelcome && (
          <button
            type="button"
            className="aq-icon-btn"
            onClick={() => {
              stickRef.current = true;
              listRef.current?.scrollTo({
                top: listRef.current.scrollHeight,
                behavior: reduced ? "auto" : "smooth",
              });
            }}
            aria-label="Scroll to latest message"
            style={{
              position: "absolute",
              left: "50%",
              bottom: "calc(100% + 8px)",
              transform: "translateX(-50%)",
              width: 40,
              height: 40,
              zIndex: 3,
              background: "rgba(var(--aq-gl),.92)",
            }}
          >
            <ArrowDown size={18} />
          </button>
        )}
        <div
          style={{
            maxWidth: isWelcome ? 480 : 760,
            transition: "max-width .42s cubic-bezier(.22,.8,.24,1)",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          {p.peekText && (
            <div
              role="status"
              aria-live="polite"
              className="aq-glass"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 6px 6px 10px",
                borderRadius: 20,
                background: "rgba(var(--aq-gl),.8)",
                animation: "aqAquaIn .4s cubic-bezier(.2,.8,.2,1) both",
              }}
            >
              <AquaAvatar size={22} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13,
                  lineHeight: 1.45,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.peekText}
              </span>
              <button
                type="button"
                className="aq-btn aq-btn-dark"
                onClick={p.onPeekOpen}
                style={{ height: 44, padding: "0 14px", fontSize: 12.5 }}
              >
                Open chat
              </button>
              <button
                type="button"
                className="aq-icon-btn"
                onClick={p.onPeekDismiss}
                aria-label="Dismiss preview"
                style={{
                  border: 0,
                  background: "transparent",
                  boxShadow: "none",
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {parked && (
            <button
              type="button"
              className="aq-btn aq-btn-primary"
              onClick={() => p.dispatch({ type: "RESUME" })}
              style={{
                height: 38,
                fontSize: 13,
                animation: "aqPop .3s ease both",
              }}
            >
              {p.flow.parked === "payment_failed"
                ? "Back to payment"
                : "Back to checkout"}
            </button>
          )}
          {p.compare.length > 0 && !p.hideComposer && (
            <div
              className="aq-btn-dark"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 6px 6px 14px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              <span style={{ flex: 1 }}>
                {p.compare.length === 1
                  ? "1 product selected · pick one more to compare"
                  : `${p.compare.length} products selected`}
              </span>
              <button
                type="button"
                onClick={p.onClearCompare}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#B8C6CC",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  minHeight: 32,
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="aq-btn"
                disabled={p.compare.length < 2}
                onClick={() => p.onSend("Compare these")}
                style={{
                  height: 32,
                  padding: "0 14px",
                  fontSize: 12.5,
                  background: "#008B68",
                  color: "#fff",
                }}
              >
                Compare
              </button>
            </div>
          )}
          {p.chat.limit && !p.hideComposer && (
            <AquaLimitCard
              limit={p.chat.limit}
              quota={p.chat.quota}
              onSignIn={p.onSignIn}
              signingIn={p.signingIn}
              signInError={p.signInError}
            />
          )}
          {!p.hideComposer && (
            <Composer
              placeholder={
                p.chat.limit ? "No questions left for today" : placeholder
              }
              busy={busy}
              large={false}
              disabled={!!p.chat.limit}
              counter={p.chat.quota ? quotaLabel(p.chat.quota) : ""}
              onSend={p.onSend}
              onFocusChange={p.onFocusChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
