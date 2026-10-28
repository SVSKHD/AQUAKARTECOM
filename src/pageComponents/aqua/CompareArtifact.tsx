"use client";

import { ChevronRight, Columns3 } from "lucide-react";
import type { Product } from "./types";

// A comparison in the chat is an artifact: this card stands in for it, and the
// side-by-side table opens in the workspace panel, where each product can be
// viewed or bought.
export default function CompareArtifact({
  products,
  active,
  onOpen,
}: {
  products: Product[];
  // This comparison is the one open in the panel.
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="aq-card aq-artifact"
      aria-current={active}
      aria-label={`Open comparison of ${products.map((p) => p.title).join(", ")}`}
      onClick={onOpen}
    >
      <span className="aq-artifact-thumbs" aria-hidden="true">
        {products.map((p) => (
          <span
            key={p.id}
            style={{
              background: p.photos[0]
                ? `var(--aq-surf) center / contain no-repeat url("${p.photos[0]}")`
                : "repeating-linear-gradient(135deg, var(--aq-mint) 0 6px, var(--aq-tint) 6px 12px)",
            }}
          />
        ))}
      </span>
      <span className="aq-artifact-body">
        <span className="aq-artifact-kicker">
          <Columns3
            size={12}
            style={{ verticalAlign: "-2px", marginRight: 4 }}
            aria-hidden="true"
          />
          Comparison · {products.length} products
        </span>
        <span className="aq-artifact-names">
          {products.map((p) => p.title).join(" vs ")}
        </span>
      </span>
      <span className="aq-artifact-open">
        {active ? "Open" : "View"} <ChevronRight size={15} />
      </span>
    </button>
  );
}
