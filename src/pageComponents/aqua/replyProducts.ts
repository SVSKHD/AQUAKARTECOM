import { parseReply } from "@/components/assistant/AssistantReply";
import type { Product } from "./types";

export type ReplyBlock = { kind: "p" | "ul" | "ol" | "h"; lines: string[] };

// A reply split into prose and per-product write-ups, so what Aqua says about a
// product sits on that product's card instead of in a wall of text above the cards.
export type ReplySegment =
  | { kind: "text"; blocks: ReplyBlock[] }
  | { kind: "product"; product: Product; summary: string; points: string[] };

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\*\*/g, "")
    // "40L", "40 L" and "40 litre" all name the same model as "40".
    .replace(/(\d)\s*(?:l|ltrs?|litres?|liters?)\b/g, "$1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Words every product in a category shares; they can't tell two products apart.
const GENERIC = new Set(
  "the a an and with for water softener softeners purifier purifiers filter filters ro uv uf l litre litres ltr home system auto automatic".split(
    " ",
  ),
);

const score = (lead: string, title: string) => {
  const l = norm(lead);
  const t = norm(title);
  if (!l || !t) return 0;
  if (l === t) return 1;
  if (l.includes(t)) return 0.95;
  const ls = l.split(" ");
  const ts = t.split(" ");
  if (t.includes(l) && ls.length >= 2 && ls.some((w) => !GENERIC.has(w)))
    return 0.9;
  const shared = ts.filter((w) => ls.includes(w));
  const distinctive = shared.filter((w) => !GENERIC.has(w));
  const overlap = shared.length / ts.length;
  return distinctive.length >= 1 && shared.length >= 2 && overlap >= 0.6
    ? overlap * 0.8
    : 0;
};

const bestMatch = (lead: string, products: Product[]) => {
  let best: Product | null = null;
  let top = 0;
  for (const p of products) {
    const s = score(lead, p.title);
    if (s > top) [best, top] = [p, s];
  }
  return best;
};

const SEP = /^\s*(?:[–—:|,]|-(?=\s))\s*/;

// "**Name** – why it fits" or "Name: why it fits" → the name and the rest.
const splitLead = (line: string) => {
  const bold = line.match(/^\s*\*\*([^*\n]+)\*\*/);
  if (bold)
    return { lead: bold[1], rest: line.slice(bold[0].length).replace(SEP, "") };
  const cut = line.search(/\s[–—-]\s|:\s/);
  if (cut > 0 && cut <= 80)
    return { lead: line.slice(0, cut), rest: line.slice(cut).replace(SEP, "") };
  return null;
};

const leadMatch = (raw: string, products: Product[]) => {
  const line = raw.replace(/^\s*\d+[.)]\s*/, "");
  const split = splitLead(line);
  if (!split) {
    // No name/description split: only a sentence that opens with the full title.
    const l = norm(line);
    const product = products.find((p) => {
      const t = norm(p.title);
      return !!t && (l === t || l.startsWith(`${t} `));
    });
    if (!product) return null;
    return { product, rest: l === norm(product.title) ? "" : line.trim() };
  }
  const product = bestMatch(split.lead, products);
  return product ? { product, rest: split.rest.trim() } : null;
};

// Returns null when the reply doesn't write about any of `products` by name.
export function splitReply(
  text: string,
  products: Product[],
): ReplySegment[] | null {
  if (!products.length) return null;
  const blocks = parseReply(text) as ReplyBlock[];
  const out: ReplySegment[] = [];
  const seen = new Map<string, Extract<ReplySegment, { kind: "product" }>>();
  // The product a heading or bold paragraph opened, which its bullets belong to.
  let open: Extract<ReplySegment, { kind: "product" }> | null = null;

  const pushText = (block: ReplyBlock) => {
    const last = out[out.length - 1];
    if (last?.kind === "text") last.blocks.push(block);
    else out.push({ kind: "text", blocks: [block] });
  };
  const startProduct = (product: Product, summary: string) => {
    const prev = seen.get(product.id);
    if (prev) {
      if (summary) prev.points.push(summary);
      return prev;
    }
    const seg = { kind: "product" as const, product, summary, points: [] };
    seen.set(product.id, seg);
    out.push(seg);
    return seg;
  };

  for (const b of blocks) {
    if (b.kind === "h") {
      const m = leadMatch(b.lines[0], products);
      open = m ? startProduct(m.product, m.rest) : null;
      if (!m) pushText(b);
      continue;
    }
    if (b.kind === "ul" || b.kind === "ol") {
      // Nested bullets parse as their own list, so a product item stays open
      // across adjacent lists and collects them as its points.
      let pending: string[] = [];
      const flush = () => {
        if (pending.length) pushText({ kind: b.kind, lines: pending });
        pending = [];
      };
      for (const line of b.lines) {
        const m = leadMatch(line, products);
        if (m) {
          flush();
          open = startProduct(m.product, m.rest);
        } else if (open) open.points.push(line);
        else pending.push(line);
      }
      flush();
      continue;
    }
    // Paragraph: a bold product name at its start opens a write-up; the first
    // paragraph under a product heading is that product's summary.
    const m = /^\s*\*\*/.test(b.lines[0])
      ? leadMatch(b.lines[0], products)
      : null;
    if (m) {
      open = startProduct(
        m.product,
        [m.rest, ...b.lines.slice(1)].filter(Boolean).join(" "),
      );
    } else if (open && !open.summary && !open.points.length) {
      open.summary = b.lines.join(" ");
    } else {
      open = null;
      pushText(b);
    }
  }
  return seen.size ? out : null;
}

// Catalogue products the reply writes about, in the order it mentions them.
export const mentionedProducts = (text: string, products: Product[]) =>
  (splitReply(text, products) || [])
    .flatMap((s) => (s.kind === "product" ? [s.product.id] : []))
    .slice(0, 6);
