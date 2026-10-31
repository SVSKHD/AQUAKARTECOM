"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import CompareTable from "./CompareTable";
import type { Product } from "./types";

const QUESTION = "Which of these should I pick for my home?";

// "Which one suits me": idle → Aqua answering in the chat (loader) → the
// answer is ready (a button that closes the panel to read it).
type AskPhase = "idle" | "asking" | "ready";

// The comparison artifact, open in the workspace panel. Every compared product
// can be opened (product detail) or bought (straight to checkout and payment).
export default function ComparePanel({
  products,
  onView,
  onBuy,
  onAsk,
  chatBusy = false,
  onViewAnswer,
}: {
  products: Product[];
  onView: (id: string) => void;
  onBuy: (id: string) => void;
  onAsk: (text: string) => void;
  chatBusy?: boolean;
  onViewAnswer?: () => void;
}) {
  const [phase, setPhase] = useState<AskPhase>("idle");
  // The reply started: its end means the answer is ready.
  const started = useRef(false);
  useEffect(() => {
    if (phase !== "asking") return;
    if (chatBusy) {
      started.current = true;
      return;
    }
    if (started.current) {
      setPhase("ready");
      return;
    }
    // The question never went out (e.g. a message limit): back to idle.
    const t = setTimeout(() => setPhase("idle"), 4000);
    return () => clearTimeout(t);
  }, [phase, chatBusy]);

  const ask = () => {
    started.current = false;
    setPhase("asking");
    onAsk(QUESTION);
  };

  return (
    <div
      className="aq-noscroll"
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        padding: "76px 16px 28px",
      }}
    >
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2
            className="aq-display"
            style={{ margin: 0, fontSize: 24, fontWeight: 700 }}
          >
            Comparison
          </h2>
          <span style={{ fontSize: 14, color: "var(--aq-mut)" }}>
            {products.length} products side by side. View one for details, or
            buy it here and pay online or on delivery.
          </span>
        </div>
        {products.length > 1 ? (
          <CompareTable products={products} onOpen={onView} onBuy={onBuy} />
        ) : (
          <div
            className="aq-card"
            style={{ padding: 18, fontSize: 14, color: "var(--aq-mut)" }}
          >
            These products aren&apos;t in the catalogue any more.
          </div>
        )}
        <div className="aq-cmp-ask" data-phase={phase} aria-live="polite">
          {phase === "ready" ? (
            <button
              type="button"
              className="aq-btn aq-btn-dark aq-cmp-ask-ready"
              onClick={() => {
                setPhase("idle");
                onViewAnswer?.();
              }}
            >
              <Sparkles size={15} aria-hidden="true" />
              Aqua&apos;s answer is ready · Close &amp; view
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="aq-chip aq-chip-soft"
              onClick={ask}
              disabled={phase === "asking" || chatBusy}
              aria-busy={phase === "asking"}
              style={{ fontSize: 13 }}
            >
              {phase === "asking" ? (
                <>
                  <span className="aq-cmp-ask-spin" aria-hidden="true" />
                  Aqua is comparing these for your home…
                </>
              ) : (
                <>
                  <Sparkles size={14} aria-hidden="true" /> Ask Aqua which one
                  suits me
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
