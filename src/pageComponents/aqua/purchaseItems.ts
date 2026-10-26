import type { Product } from "./types";

// Invoice line names are typed by staff ("KENT Sandfilter | Aquakart",
// "Kent Automatic Softener 25L"); catalogue titles differ in case, suffixes and
// punctuation. Normalise both, then match exactly, else by containment.
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\|\s*aquakart\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Shorter than this, containment is too loose ("kent", "filter").
const MIN_CONTAINED = 8;

export const matchPurchaseItem = (
  name: string,
  products: Product[],
): Product | null => {
  const n = norm(name);
  if (!n) return null;
  const exact = products.find((p) => norm(p.title) === n);
  if (exact) return exact;
  // The longest catalogue title contained in the line (or containing it) is
  // the most specific match: "kent automatic water softener 25" over "kent".
  let best: Product | null = null;
  let bestLen = 0;
  for (const p of products) {
    const t = norm(p.title);
    if (t.length < MIN_CONTAINED) continue;
    const hit = n.includes(t) || (n.length >= MIN_CONTAINED && t.includes(n));
    if (hit && t.length > bestLen) {
      best = p;
      bestLen = t.length;
    }
  }
  return best;
};

// What a purchase's quick view lists: the API's full lines when it sends them,
// else the item names it does send (the first few), each with its catalogue
// match, plus how many more the invoice has.
export type PurchaseLine = {
  name: string;
  qty?: number;
  price?: number;
  product: Product | null;
};

export const purchaseLines = (
  inv: {
    items: string[];
    itemCount: number;
    lines?: { name: string; qty?: number; price?: number }[];
  },
  products: Product[],
): { lines: PurchaseLine[]; more: number } => {
  const src = inv.lines?.length
    ? inv.lines
    : inv.items.map((name) => ({ name }));
  const lines = src
    .filter((l) => l.name && l.name.trim())
    .map((l) => ({
      ...l,
      name: l.name.replace(/\s*\|\s*aquakart\s*$/i, "").trim(),
      product: matchPurchaseItem(l.name, products),
    }));
  return { lines, more: Math.max(0, inv.itemCount - lines.length) };
};
