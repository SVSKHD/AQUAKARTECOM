"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, X } from "lucide-react";
import type { Flow } from "@/utils/aquaFlow";
import logo from "@/assests/logo.png";
import AquaDroplet from "./AquaDroplet";
import AquaReply from "./AquaReply";
import Composer from "./Composer";
import CompareTable from "./CompareTable";
import HardnessCard from "./HardnessCard";
import ProductCard from "./ProductCard";
import { aquaConfig } from "./config";
import { useReducedMotion } from "./hooks";
import { ACTION_CHIPS, type AquaChat } from "./useAquaChat";
import type { ChatMessage, FlowDispatch, Mood, Product } from "./types";

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
  onSend: (text: string) => boolean;
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

  const onChip = (label: string) => {
    if (ACTION_CHIPS.has(label) && p.flow.state === "product") return p.onBuy();
    p.onSend(label);
  };

  const placeholder =
    p.selectedProduct && p.flow.state === "product"
      ? `Ask about ${p.selectedProduct.title}…`
      : isWelcome
        ? "Ask Aqua anything…"
        : "Message Aqua…";

  const parked = p.flow.state === "chatting" && p.flow.parked;
  const msgMax = p.panelOpen ? 860 : 760;

  const renderMessage = (m: ChatMessage) => {
    if (m.role === "user")
      return (
        <div key={m.id} style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            className="aq-btn-dark"
            style={{
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
            {m.text}
            {m.productId && p.products.get(m.productId) && (
              <span
                style={{
                  display: "block",
                  marginTop: 4,
                  fontSize: 11.5,
                  color: "#B8C6CC",
                }}
              >
                About {p.products.get(m.productId)!.title}
              </span>
            )}
          </div>
        </div>
      );

    const cards = (m.products || [])
      .map((id) => p.products.get(id))
      .filter((x): x is Product => !!x);
    const table = (m.table || [])
      .map((id) => p.products.get(id))
      .filter((x): x is Product => !!x);
    const streaming = !m.done && !m.typing;
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
          <AquaDroplet mood="idle" size={28} dark={p.dark} still />
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
            m.text && (
              <div
                className="aq-card"
                style={{
                  borderRadius: "6px 20px 20px 20px",
                  padding: "13px 18px",
                  fontSize: 15,
                  lineHeight: 1.58,
                  maxWidth: "100%",
                  textWrap: "pretty",
                  overflowWrap: "anywhere",
                }}
              >
                {/* Plain text while streaming (no half-parsed markdown), formatted once complete. */}
                {streaming ? m.text : <AquaReply text={m.full || m.text} />}
                {streaming && (
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
                width: "100%",
              }}
            >
              {cards.map((c, i) => (
                <ProductCard
                  key={c.id}
                  product={c}
                  delay={i * 0.08}
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
            </div>
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
                  onClick={() => onChip(c)}
                  style={{
                    animation: `aqChipIn .4s cubic-bezier(.2,.8,.2,1) ${i * 0.05}s both`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
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
                  fontSize: "clamp(28px, 3.4vw, 40px)",
                  lineHeight: 1.15,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  textWrap: "balance",
                }}
              >
                {firstName
                  ? `Welcome back, ${firstName}. What can I find for you today?`
                  : "Hi, I'm Aqua. What can I find for you today?"}{" "}
                <span aria-hidden="true">💧</span>
              </h1>
              <p
                style={{
                  margin: "0 auto",
                  maxWidth: 620,
                  fontSize: "clamp(15px, 1.4vw, 17px)",
                  lineHeight: 1.6,
                  color: "var(--aq-body)",
                  textWrap: "pretty",
                }}
              >
                {firstName
                  ? "Your chats, cart and favourites are saved. Pick up where you left off or ask me something new."
                  : "Tell me about your water and your home. I'll suggest what fits, and you can buy without leaving this chat."}
              </p>
            </div>
            <HardnessCard onAsk={p.onSend} />
            <div
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
            bottom: 120,
            transform: "translateX(-50%)",
            width: 40,
            height: 40,
            zIndex: 3,
          }}
        >
          <ArrowDown size={18} />
        </button>
      )}

      <div
        ref={setCompRef}
        style={{
          padding: "6px 0 4px",
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
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
              <AquaDroplet mood="speaking" size={22} dark={p.dark} still />
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
          {!p.hideComposer && (
            <Composer
              placeholder={placeholder}
              busy={busy}
              large={false}
              onSend={p.onSend}
              onFocusChange={p.onFocusChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
