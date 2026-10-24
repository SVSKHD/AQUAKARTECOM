// Product descriptions arrive as CMS HTML: an intro paragraph, a list of
// <h4>label</h4><p>value</p> spec pairs, sometimes headings, bullet lists and a
// "<strong>Important:</strong> …" note. Some are stored escaped (&lt;p&gt; inside
// <div>s). This turns either shape into plain-text blocks the panel lays out
// itself; nothing from the HTML is ever rendered as markup.

export type Fact = { label: string; value: string };
export type DescBlock =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "facts"; items: Fact[] }
  | { kind: "note"; label: string; text: string };

const decode = (s: string) =>
  s
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/gi, "&");

const clean = (s: string) => decode(s).replace(/\s+/g, " ").trim();

// Labels that repeat what the panel already shows.
const SKIP_FACT = /^product name$/i;

export function parseDescription(html: unknown): DescBlock[] {
  if (typeof html !== "string" || !html.trim()) return [];
  // Escaped markup becomes real tags; real markup keeps its entities until clean().
  const src = /&lt;\/?(p|h\d|ul|li)\b/i.test(html) ? decode(html) : html;

  const out: DescBlock[] = [];
  let open: "p" | "h" | null = null;
  let buf = "";
  let strong: string | null = null; // a bold lead-in such as "Important:"
  let li: { head: string; body: string[] } | null = null;

  const push = (b: DescBlock) => {
    const last = out[out.length - 1];
    if (b.kind === "facts" && last?.kind === "facts")
      last.items.push(...b.items);
    else if (b.kind === "list" && last?.kind === "list")
      last.items.push(...b.items);
    else out.push(b);
  };
  const flush = () => {
    const text = clean(buf);
    const kind = open;
    const label = strong;
    buf = "";
    open = null;
    strong = null;
    // Empty, or editor debris like a stray ``` fence.
    if (!/[a-z0-9]/i.test(text)) return;
    if (li) {
      if (kind === "h" && !li.head) li.head = text;
      else li.body.push(text);
      return;
    }
    if (kind === "h") return push({ kind: "h", text });
    if (label && text.startsWith(label) && text.length > label.length) {
      const rest = text.slice(label.length).replace(/^[\s:–—-]+/, "");
      return push({
        kind: "note",
        label: label.replace(/[:\s]+$/, ""),
        text: rest,
      });
    }
    push({ kind: "p", text });
  };

  const re = /<(\/?)([a-z][a-z0-9]*)[^>]*>|([^<]+)/gi;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const [, close, rawTag, text] = m;
    if (text !== undefined) {
      buf += text;
      continue;
    }
    const tag = rawTag.toLowerCase();
    if (tag === "p" || /^h[1-6]$/.test(tag)) {
      flush();
      if (!close) open = tag === "p" ? "p" : "h";
    } else if (tag === "strong" || tag === "b") {
      const lead = clean(buf);
      if (close && !strong && lead.length <= 40 && lead.endsWith(":"))
        strong = lead;
    } else if (tag === "li") {
      flush();
      if (!close) li = { head: "", body: [] };
      else if (li) {
        const { head, body } = li;
        li = null;
        if (head && body.length) {
          if (!SKIP_FACT.test(head))
            push({
              kind: "facts",
              items: [{ label: head, value: body.join(" ") }],
            });
        } else if (head || body.length) {
          push({ kind: "list", items: [head || body.join(" ")] });
        }
      }
    } else if (tag === "ul" || tag === "ol" || tag === "br" || tag === "div") {
      // Text sitting directly in a <div> is its own paragraph.
      if (!open) flush();
    }
  }
  flush();
  return out;
}

export const descriptionText = (blocks: DescBlock[]) =>
  blocks
    .map((b) =>
      b.kind === "facts"
        ? b.items.map((f) => `${f.label}: ${f.value}`).join(". ")
        : b.kind === "list"
          ? b.items.join(". ")
          : b.kind === "note"
            ? `${b.label}: ${b.text}`
            : b.text,
    )
    .join(" ");

export const findFact = (blocks: DescBlock[], label: RegExp) =>
  blocks
    .flatMap((b) => (b.kind === "facts" ? b.items : []))
    .find((f) => label.test(f.label))?.value;
