// Blog posts as short reads for the "while Aqua thinks" panel: plain text only
// (CMS HTML is never injected into the chat) plus a script to read aloud.

export type BlogRead = {
  id: string;
  title: string;
  href: string;
  image: string | null;
  summary: string;
  highlights: string[];
  paragraphs: string[];
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
    highlights: (b.keyHighlights || []).map(clean).filter(Boolean).slice(0, 4),
    // The summary often repeats the opening paragraph; don't show it twice.
    paragraphs: paragraphs.filter((x) => x !== summary),
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
