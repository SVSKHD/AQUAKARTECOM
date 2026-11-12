// Blog posts as short reads for the "while Aqua thinks" panel: plain text only
// (CMS HTML is never injected into the chat) plus a script to read aloud.

// The article's structure, as plain text: headings, paragraphs, list items
// and quotes (the CMS HTML itself is never injected).
export type BlogBlock = { kind: "h" | "p" | "li" | "quote"; text: string };

export type BlogRead = {
  id: string;
  title: string;
  href: string;
  image: string | null;
  summary: string;
  highlights: string[];
  paragraphs: string[];
  // Absent on reads built before blocks existed: use the paragraphs.
  blocks?: BlogBlock[];
  minutes: number;
};

type RawBlog = {
  _id?: string;
  slug?: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  summary?: string;
  keyHighlights?: string[];
  titleImages?: { secure_url?: string }[];
  photos?: { secure_url?: string }[];
  status?: string;
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n =
        e[1] === "x" || e[1] === "X"
          ? parseInt(e.slice(2), 16)
          : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });

// Tags become spaces, so "<b>harder</b>." would read "harder ." without the
// last replace. Some posts also carry markdown inside the HTML (**bold**,
// "## Heading"), which would show as symbols and be read out as "star star".
const clean = (s: string) =>
  decode(s)
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/^\s*#{1,6}\s+/, "")
    .replace(/\s+/g, " ")
    .replace(/ ([.,;:!?])/g, "$1")
    .trim();

// One paragraph per block element (or <br>), tags and scripts removed.
export const htmlToParagraphs = (html = ""): string[] =>
  html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr|figcaption)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\n+/)
    .map(clean)
    .filter((x) => /[a-z0-9]/i.test(x));

// Like htmlToParagraphs, but keeps what each block was. Markdown left inside
// the HTML ("## Heading", "- item") counts too.
// Block openers become line markers ("@@h@@ The Solution"), closers line breaks.
const TAG = /^\s*@@(h|li|quote)@@/;
export const htmlToBlocks = (html = ""): BlogBlock[] =>
  html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<h[1-6][^>]*>/gi, "\n@@h@@")
    .replace(/<li[^>]*>/gi, "\n@@li@@")
    .replace(/<blockquote[^>]*>/gi, "\n@@quote@@")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr|figcaption)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\n+/)
    .map((line): BlogBlock | null => {
      const tagged = line.match(TAG);
      const raw = tagged ? line.slice(tagged[0].length) : line;
      let kind = (tagged?.[1] as BlogBlock["kind"] | undefined) || "p";
      if (kind === "p" && /^\s*#{1,6}\s+/.test(raw)) kind = "h";
      else if (kind === "p" && /^\s*[-*•]\s+/.test(raw)) kind = "li";
      const text = clean(raw.replace(/^\s*[-*•]\s+/, ""));
      return /[a-z0-9]/i.test(text) ? { kind, text } : null;
    })
    .filter((b): b is BlogBlock => !!b);

// Key points arrive as a list, or as one JSON-encoded list in a string.
const points = (list: unknown): string[] =>
  (Array.isArray(list) ? list : [list]).flatMap((x) => {
    const s = String(x ?? "").trim();
    if (s.startsWith("[")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // not JSON: use as it is
      }
    }
    return s ? [s] : [];
  });

const WORDS_PER_MINUTE = 200;

// The chat shows only the newest few; the rest are on the blog page.
export const READS_LIMIT = 3;
export const BLOG_URL = "/blogs";

export const toBlogRead = (b: RawBlog): BlogRead | null => {
  const title = clean(b.title || "");
  const paragraphs = htmlToParagraphs(b.description);
  if (!title || !paragraphs.length) return null;
  const summary =
    clean(b.shortDescription || b.summary || "") || paragraphs[0] || "";
  const words = paragraphs.join(" ").split(" ").length;
  return {
    id: String(b._id || b.slug || title),
    title,
    href: `/blog/${encodeURIComponent(b.slug || b._id || "")}`,
    image: b.titleImages?.[0]?.secure_url || b.photos?.[0]?.secure_url || null,
    summary,
    highlights: points(b.keyHighlights).map(clean).filter(Boolean).slice(0, 5),
    // The summary often repeats the opening paragraph; don't show it twice.
    paragraphs: paragraphs.filter((x) => x !== summary),
    blocks: htmlToBlocks(b.description).filter((x) => x.text !== summary),
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
};

// GET /all-blogs answers { success, data: Blog[] }, newest first.
export const toBlogReads = (body: unknown, limit = READS_LIMIT): BlogRead[] => {
  const list = (body as { data?: unknown })?.data;
  if (!Array.isArray(list)) return [];
  return list
    .filter((b: RawBlog) => b && b.status !== "draft")
    .map(toBlogRead)
    .filter((x): x is BlogRead => !!x)
    .slice(0, limit);
};

// What "Listen as podcast" reads: a short intro, the summary and key points,
// then the article, then a sign-off.
export const podcastScript = (b: BlogRead) =>
  [
    `You're listening to Aquakart Reads. ${b.title}.`,
    b.summary,
    b.highlights.length ? `Key points. ${b.highlights.join(". ")}.` : "",
    ...b.paragraphs,
    "That's the end of this episode. Thanks for listening to Aquakart Reads.",
  ]
    .filter(Boolean)
    .join("\n");

// ---------- reading a post in the artifact box (desktop) ----------

// Fired on window with the read as detail. The workspace answers by calling
// preventDefault() when it can show the post in its artifact box; otherwise
// (phones, no box) the caller opens it in place as before.
export const OPEN_BLOG = "aqua:open-blog";
export const openBlogInArtifact = (read: BlogRead): boolean => {
  if (typeof window === "undefined") return false;
  const e = new CustomEvent<BlogRead>(OPEN_BLOG, {
    detail: read,
    cancelable: true,
  });
  window.dispatchEvent(e);
  return e.defaultPrevented;
};

// Every published post (for related reads), one request per page visit.
let all: Promise<BlogRead[]> | null = null;
export const loadAllReads = (
  fetchAll: () => Promise<{ data: unknown }>,
): Promise<BlogRead[]> =>
  (all ??= fetchAll()
    .then((res) => toBlogReads(res.data, 200))
    .catch(() => {
      all = null;
      return [];
    }));

const STOP = new Set(
  "a an and are as at be best by can do does for from get how in is it its of on or our the to vs what when which why with you your water home 2024 2025 2026 guide tips".split(
    " ",
  ),
);
const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );

// Other posts on the same subject: shared words in the title (counted
// double) and key points. Newest wins a tie (the list is newest first).
export function relatedReads(
  read: BlogRead,
  list: BlogRead[],
  limit = 3,
): BlogRead[] {
  const mineTitle = words(read.title);
  const mine = words(`${read.title} ${read.highlights.join(" ")}`);
  return list
    .filter((r) => r.id !== read.id)
    .map((r, i) => {
      let score = 0;
      for (const w of words(r.title)) if (mineTitle.has(w)) score += 2;
      for (const w of words(`${r.title} ${r.highlights.join(" ")}`))
        if (mine.has(w)) score += 1;
      return { r, score, i };
    })
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.r);
}

type ShopItem = {
  id: string;
  title: string;
  cat: string;
  price: number;
  inStock: boolean;
};
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Products a post is about: any it names by title, then (to fill up) in-stock
// products from the category it talks about most (softeners, purifiers,
// filters), cheapest first.
export function relatedProducts<P extends ShopItem>(
  read: BlogRead,
  products: P[],
  limit = 4,
): P[] {
  const text = norm(
    [read.title, read.summary, ...read.highlights, ...read.paragraphs].join(
      " ",
    ),
  );
  const named = products.filter((p) => {
    const t = norm(p.title);
    return t.length > 5 && text.includes(t);
  });
  const count = (re: RegExp) => (text.match(re) || []).length;
  const cats: [string, number][] = [
    ["softener", count(/\bsoften|\bhard(ness)?\b|\bscal/g)],
    ["purifier", count(/\bpurif|\bro\b|\btds\b|\bdrinking/g)],
    ["filter", count(/\bfilter|\bsediment|\biron\b|\bsand\b/g)],
  ];
  const [cat, hits] = cats.sort((a, b) => b[1] - a[1])[0];
  const fill = hits
    ? products
        .filter((p) => p.cat === cat && p.inStock && !named.includes(p))
        .sort((a, b) => a.price - b.price)
    : [];
  return [...named, ...fill].slice(0, limit);
}
