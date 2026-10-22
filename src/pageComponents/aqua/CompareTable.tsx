"use client";

import { INR } from "./catalogue";
import type { Product } from "./types";

const ROWS: [string, (p: Product) => string][] = [
  ["Price", (p) => INR(p.price)],
  ["Capacity", (p) => p.capacity || "Not listed"],
  ["Flow rate", (p) => p.flow || "Not listed"],
  [
    "Household",
    (p) => (p.maxPeople ? `Up to ${p.maxPeople} people` : "Not listed"),
  ],
  ["Max hardness", (p) => (p.maxPpm ? `${p.maxPpm} ppm` : "Not listed")],
  ["Regeneration", (p) => p.regen || "Not listed"],
  ["Warranty", (p) => p.warranty || "Not listed"],
  ["Availability", (p) => p.stock],
];

export default function CompareTable({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (id: string) => void;
}) {
  const gtc = `minmax(110px, .8fr) repeat(${products.length}, minmax(140px, 1fr))`;
  return (
    <div
      className="aq-card"
      role="table"
      aria-label="Product comparison"
      style={{ width: "100%", borderRadius: 18, overflowX: "auto" }}
    >
      <div
        role="row"
        style={{
          display: "grid",
          gridTemplateColumns: gtc,
          fontSize: 13,
          minWidth: 420,
        }}
      >
        <div role="columnheader" style={{ padding: "10px 14px" }} />
        {products.map((p) => (
          <div role="columnheader" key={p.id} style={{ padding: "10px 14px" }}>
            <button
              type="button"
              onClick={() => onOpen(p.id)}
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                color: "var(--aq-ink)",
                fontWeight: 700,
                fontSize: 13,
                textAlign: "left",
                lineHeight: 1.3,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {p.title}
            </button>
          </div>
        ))}
      </div>
      {ROWS.map(([label, get], i) => (
        <div
          role="row"
          key={label}
          style={{
            display: "grid",
            gridTemplateColumns: gtc,
            borderTop: "1px solid rgba(var(--aq-ln),.06)",
            fontSize: 13,
            minWidth: 420,
            animation: `aqRowIn .4s ease ${i * 0.04}s both`,
          }}
        >
          <div
            role="rowheader"
            style={{
              padding: "10px 14px",
              color: "var(--aq-mut)",
              fontWeight: 600,
            }}
          >
            {label}
          </div>
          {products.map((p) => (
            <div
              role="cell"
              key={p.id}
              style={{
                padding: "10px 14px",
                fontWeight: i === 0 ? 700 : 500,
                lineHeight: 1.4,
              }}
            >
              {get(p)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
