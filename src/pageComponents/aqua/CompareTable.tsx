"use client";

import { useState } from "react";
import { INR } from "./catalogue";
import { REGEN_LABEL, softenerFacts } from "./softenerSizing";
import type { Product } from "./types";

const SCOPE_TEXT = {
  "whole-home": "Whole home",
  bathroom: "One bathroom",
  appliance: "Washing machine only",
} as const;

// Side-by-side comparison built from what the compared products actually list.
// The live catalogue has no structured spec fields: specs come from each
// product's description facts (product.about), plus the few mapped fields.
// Rows nobody has are dropped, so the table never fills with "Not listed".

type Cell = string | null;
type Row = { key: string; label: string; cells: Cell[]; best?: number };

// Description fact labels that aren't useful for choosing.
const NOISE = /^(product code|product generic name|sku|model no\.?|hsn)$/i;

// Preferred order for common facts; anything else follows in first-seen order.
const ORDER = [
  /resin volume|^capacity|storage capacity|tank capacity/,
  /flow rate|production rate/,
  /softened before regeneration|regeneration/,
  /household|people|family/,
  /hardness/,
  /ideal place|installation|mounting/,
  /dimension/,
  /weight/,
  /power|voltage/,
  /temperature/,
  /warranty/,
];
const rank = (label: string) => {
  const i = ORDER.findIndex((re) => re.test(label.toLowerCase()));
  return i === -1 ? ORDER.length : i;
};

// "Dimensions(mm)" and "Dimensions (mm)" are the same row.
const keyOf = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "");
// Listings mix "Flow Rate" / "Flow rate": show labels in sentence case.
const displayLabel = (label: string) => {
  const s = label
    .trim()
    .replace(/\s*\(/g, " (")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const clean = (v: unknown): Cell => {
  const s =
    typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  return s ? s : null;
};

const subCategory = (p: Product) => {
  const raw = p.raw as { subCategory?: { title?: string } } | undefined;
  const t = raw?.subCategory?.title || "";
  return (
    clean(
      t
        .replace(/[-_]+/g, " ")
        .replace(/\bsofteners?\b/i, "")
        .trim(),
    ) || clean(p.regen)
  );
};

function buildRows(products: Product[]): Row[] {
  const rows: Row[] = [];

  // Price, with the lowest marked.
  const prices = products.map((p) => p.price);
  const min = Math.min(...prices);
  rows.push({
    key: "price",
    label: "Price",
    cells: products.map((p) => INR(p.price)),
    best:
      prices.filter((x) => x === min).length === 1
        ? prices.indexOf(min)
        : undefined,
  });

  // Softeners: automatic or manual, and what each treats — the first things to tell apart.
  const facts = products.map(softenerFacts);
  rows.push({
    key: "type",
    label: "Type",
    // A softener's own title/description wins: some live softeners are filed
    // under a purifier sub-category.
    cells: products.map((p, i) =>
      facts[i]?.regen ? REGEN_LABEL[facts[i]!.regen!] : subCategory(p),
    ),
  });
  rows.push({
    key: "scope",
    label: "Treats",
    cells: facts.map((f) => (f?.scope ? SCOPE_TEXT[f.scope] : null)),
  });
  rows.push({
    key: "brand",
    label: "Brand",
    cells: products.map((p) =>
      clean(p.brand?.trim().replace(/^\w/, (c) => c.toUpperCase())),
    ),
  });

  // Mapped fields (demo catalogue and anything mapReal found), then description facts.
  const specs = new Map<
    string,
    { label: string; cells: Cell[]; order: number }
  >();
  const put = (label: string, index: number, value: Cell, order: number) => {
    if (!value) return;
    const key = keyOf(label);
    const row = specs.get(key) || {
      label: displayLabel(label),
      cells: products.map(() => null),
      order,
    };
    if (!row.cells[index]) row.cells[index] = value;
    specs.set(key, row);
  };
  let seen = 0;
  products.forEach((p, i) => {
    put("Capacity", i, clean(p.capacity), seen++);
    put("Flow rate", i, clean(p.flow), seen++);
    put(
      "Household",
      i,
      p.maxPeople ? `Up to ${p.maxPeople} people` : null,
      seen++,
    );
    put("Max hardness", i, p.maxPpm ? `${p.maxPpm} ppm` : null, seen++);
    put("Regeneration", i, clean(p.regen), seen++);
    put("Warranty", i, clean(p.warranty), seen++);
    for (const block of p.about || []) {
      if (block.kind !== "facts") continue;
      for (const f of block.items) {
        if (NOISE.test(f.label.trim())) continue;
        // "Resin Volume" is what the catalogue calls capacity.
        const label = /resin volume/i.test(f.label)
          ? "Capacity"
          : f.label.trim();
        put(label, i, clean(f.value), seen++);
      }
    }
  });
  [...specs.entries()]
    .sort(([, a], [, b]) => rank(a.label) - rank(b.label) || a.order - b.order)
    .forEach(([key, r]) => rows.push({ key, label: r.label, cells: r.cells }));

  rows.push({
    key: "stock",
    label: "Availability",
    cells: products.map((p) => p.stock),
  });

  // Drop rows that no compared product has.
  return rows.filter((r) => r.cells.some(Boolean));
}

// Spec rows shown before "Show N more specs" (they're already in priority order).
const VISIBLE_SPECS = 6;
const FIXED = ["price", "type", "scope", "brand", "stock"];

export default function CompareTable({
  products,
  onOpen,
  onBuy,
}: {
  products: Product[];
  onOpen: (id: string) => void;
  // Straight to checkout for that product (the comparison panel).
  onBuy?: (id: string) => void;
}) {
  const [allSpecs, setAllSpecs] = useState(false);
  const allRows = buildRows(products);
  const specCount = allRows.filter((r) => !FIXED.includes(r.key)).length;
  const hiddenSpecs = allSpecs ? 0 : Math.max(0, specCount - VISIBLE_SPECS);
  let shownSpecs = 0;
  const rows = allRows.filter(
    (r) => FIXED.includes(r.key) || allSpecs || ++shownSpecs <= VISIBLE_SPECS,
  );
  const sparse = products.filter(
    (p) =>
      !(p.about || []).some((b) => b.kind === "facts") &&
      !p.capacity &&
      !p.flow,
  );
  const gtc = `minmax(120px, .75fr) repeat(${products.length}, minmax(150px, 1fr))`;
  // The label column stays put while the products scroll sideways under it:
  // solid, with a soft edge, so nothing shows through.
  const stickyCol = {
    position: "sticky" as const,
    left: 0,
    zIndex: 2,
    background: "var(--aq-surf)",
    boxShadow: "8px 0 10px -8px rgba(var(--aq-sh),.22)",
  };

  return (
    <div
      className="aq-card"
      style={{ width: "100%", borderRadius: 18, overflow: "hidden" }}
    >
      <div
        className="aq-noscroll"
        role="table"
        aria-label="Product comparison"
        style={{ overflowX: "auto" }}
      >
        <div
          role="row"
          style={{
            display: "grid",
            gridTemplateColumns: gtc,
            minWidth: 120 + products.length * 150,
          }}
        >
          <div
            role="columnheader"
            style={{
              ...stickyCol,
              padding: "14px 14px 10px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--aq-mut)",
              // Full height, label at the bottom: covers the scrolled headers.
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            Compare
          </div>
          {products.map((p) => (
            <div role="columnheader" key={p.id} className="aq-compare-head">
              <span
                aria-hidden="true"
                className="aq-compare-thumb"
                style={{
                  background: p.photos[0]
                    ? `var(--aq-surf) center / contain no-repeat url("${p.photos[0]}")`
                    : "repeating-linear-gradient(135deg, var(--aq-mint) 0 6px, var(--aq-tint) 6px 12px)",
                }}
              />
              {/* Clamped to two lines at a fixed height, so every column's
                  actions sit on the same line whatever the title length. */}
              <button
                type="button"
                className="aq-compare-title"
                title={p.title}
                onClick={() => onOpen(p.id)}
              >
                {p.title}
              </button>
              <span className="aq-compare-actions">
                <button
                  type="button"
                  className="aq-chip"
                  onClick={() => onOpen(p.id)}
                  aria-label={`View ${p.title}`}
                >
                  View
                </button>
                {onBuy && (
                  <button
                    type="button"
                    className="aq-chip aq-compare-buy"
                    onClick={() => onBuy(p.id)}
                    disabled={!p.inStock}
                    aria-label={`Buy ${p.title}`}
                  >
                    {p.inStock ? "Buy now" : p.stock}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div
            role="row"
            key={r.key}
            style={{
              display: "grid",
              gridTemplateColumns: gtc,
              minWidth: 120 + products.length * 150,
              borderTop: "1px solid rgba(var(--aq-ln),.06)",
              fontSize: 13,
              animation: `aqRowIn .4s ease ${i * 0.03}s both`,
            }}
          >
            <div
              role="rowheader"
              style={{
                ...stickyCol,
                padding: "11px 14px",
                color: "var(--aq-mut)",
                fontWeight: 600,
              }}
            >
              {r.label}
            </div>
            {r.cells.map((c, j) => (
              <div
                role="cell"
                key={j}
                style={{
                  padding: "11px 14px",
                  lineHeight: 1.4,
                  fontWeight: r.key === "price" ? 700 : 500,
                  color: c ? "var(--aq-ink)" : "var(--aq-mut2)",
                }}
              >
                {c || <span aria-label="Not listed">—</span>}
                {r.best === j && (
                  <span
                    style={{
                      display: "inline-block",
                      marginLeft: 8,
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: "var(--aq-mint)",
                      color: "var(--aq-mintink)",
                      verticalAlign: "middle",
                    }}
                  >
                    Lowest
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {(hiddenSpecs > 0 || (allSpecs && specCount > VISIBLE_SPECS)) && (
        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid rgba(var(--aq-ln),.06)",
          }}
        >
          <button
            type="button"
            className="aq-chip aq-chip-soft"
            aria-expanded={allSpecs}
            onClick={() => setAllSpecs((v) => !v)}
            style={{ fontSize: 12 }}
          >
            {allSpecs
              ? "Show fewer specs"
              : `Show ${hiddenSpecs} more ${hiddenSpecs === 1 ? "spec" : "specs"}`}
          </button>
        </div>
      )}
      <p
        style={{
          margin: 0,
          padding: "10px 14px 12px",
          borderTop: "1px solid rgba(var(--aq-ln),.06)",
          fontSize: 11.5,
          lineHeight: 1.5,
          color: "var(--aq-mut)",
        }}
      >
        {specCount === 0
          ? "These products don't list technical specs yet. Ask Aqua or AquaKart support to compare them for your water."
          : sparse.length
            ? `${sparse.map((p) => p.title).join(", ")} ${sparse.length === 1 ? "doesn't" : "don't"} list specs yet, so some cells are empty. Ask Aqua or support for details.`
            : "Specs are taken from each product's listing. Confirm sizing with AquaKart support before you buy."}
      </p>
    </div>
  );
}
