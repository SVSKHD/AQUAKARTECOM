"use client";

import { Sparkles } from "lucide-react";
import CompareTable from "./CompareTable";
import type { Product } from "./types";

// The comparison artifact, open in the workspace panel. Every compared product
// can be opened (product detail) or bought (straight to checkout and payment).
export default function ComparePanel({
  products,
  onView,
  onBuy,
  onAsk,
}: {
  products: Product[];
  onView: (id: string) => void;
  onBuy: (id: string) => void;
  onAsk: (text: string) => void;
}) {
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
        <button
          type="button"
          className="aq-chip aq-chip-soft"
          onClick={() => onAsk("Which of these should I pick for my home?")}
          style={{ alignSelf: "flex-start", fontSize: 13 }}
        >
          <Sparkles size={14} aria-hidden="true" /> Ask Aqua which one suits me
        </button>
      </div>
    </div>
  );
}
