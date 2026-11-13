"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Headphones,
  ListTree,
  MessageCircle,
  ShoppingCart,
  Sparkles,
  Square,
} from "lucide-react";
import { INR } from "./catalogue";
import ReadCard from "./ReadCard";
import {
  BLOG_URL,
  podcastScript,
  relatedProducts,
  relatedReads,
  type BlogBlock,
  type BlogRead,
} from "./blogReads";
import {
  canSpeak,
  speak,
  speakingNow,
  stopSpeaking,
  useSpeaking,
} from "./ReplyActions";
import type { Product } from "./types";

type Props = {
  read: BlogRead;
  // Every published post, for "Keep reading" (empty while loading).
  allReads: BlogRead[];
  products: Product[];
  // A product card, rendered by the workspace with its cart / compare actions
  // (the narrow layout, under the article).
  renderProduct: (p: Product, index: number) => ReactNode;
  onOpenRead: (read: BlogRead) => void;
  // The side rail's compact product rows (wide panels only).
  onOpenProduct?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  cartIds?: string[];
  // Asks Aqua about the post in the chat.
  onAsk?: (text: string) => void;
  onClose: () => void;
};

// Adjacent list items become one list; everything else stays a block.
type Group = BlogBlock | { kind: "ul"; items: string[] };
const group = (blocks: BlogBlock[]): Group[] => {
  const out: Group[] = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.kind === "li") {
      if (last?.kind === "ul") last.items.push(b.text);
      else out.push({ kind: "ul", items: [b.text] });
    } else out.push(b);
  }
  return out;
};

// A blog post in the artifact box: the whole article with its headings,
// lists and quotes (plain text, never the CMS HTML), a podcast reading, the
// products it's about and more posts on the subject. On a wide panel the
// products, more reads and an outline sit in a sticky rail beside the
// article; on a narrow one they follow it.
export default function BlogArtifact(p: Props) {
  const { read } = p;
  const scroller = useRef<HTMLElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const podcastId = `blog:${read.id}`;
  const playing = useSpeaking(podcastId);
  const speakable = canSpeak();
  const products = relatedProducts(read, p.products);
  const reads = relatedReads(read, p.allReads, 4);
  const cartIds = p.cartIds ?? [];
  const body = group(
    read.blocks?.length
      ? read.blocks
      : read.paragraphs.map((text) => ({ kind: "p" as const, text })),
  );
  // "On this page": the article's headings, keyed by their place in the body.
  const headingId = (i: number) => `aq-bh-${read.id}-${i}`;
  const toc = body.flatMap((b, i) =>
    b.kind === "h" ? [{ id: headingId(i), text: b.text }] : [],
  );
  const [active, setActive] = useState<string | null>(null);

  // A new post starts at its top; leaving it stops its podcast (only its own).
  useEffect(() => {
    scroller.current?.scrollTo?.({ top: 0 });
    progress.current?.style.setProperty("--aq-read", "0");
    // No outline reset needed: heading ids carry the post id, so the last
    // post's current section never matches this one.
  }, [read.id]);
  useEffect(
    () => () => {
      if (speakingNow() === podcastId) stopSpeaking();
    },
    [podcastId],
  );

  const find = (id: string) =>
    scroller.current?.querySelector<HTMLElement>(`[id="${id}"]`) ?? null;

  // Reading progress straight on the bar (no re-render per scroll); the
  // outline re-renders only when the current section changes.
  const onScroll = () => {
    const el = scroller.current;
    if (!el || !progress.current) return;
    const max = el.scrollHeight - el.clientHeight;
    progress.current.style.setProperty(
      "--aq-read",
      String(max > 0 ? Math.min(1, el.scrollTop / max) : 1),
    );
    if (toc.length < 2) return;
    const line = el.getBoundingClientRect().top + 110;
    let current: string | null = null;
    for (const t of toc) {
      const h = find(t.id);
      if (h && h.getBoundingClientRect().top <= line) current = t.id;
    }
    if (current !== active) setActive(current);
  };

  const jump = (id: string) => {
    const el = scroller.current;
    const h = find(id);
    if (!el || !h) return;
    el.scrollTo?.({
      top:
        el.scrollTop +
        h.getBoundingClientRect().top -
        el.getBoundingClientRect().top -
        84,
      behavior: "smooth",
    });
  };

  const readCard = (r: BlogRead, rail = false) => (
    <ReadCard key={r.id} read={r} rail={rail} onOpen={p.onOpenRead} />
  );

  return (
    <article
      className="aq-blogart aq-noscroll"
      aria-labelledby="aq-blogart-title"
      ref={scroller}
      onScroll={onScroll}
    >
      <div className="aq-blogart-bar">
        <button
          type="button"
          className="aq-blogart-back"
          onClick={p.onClose}
          aria-label="Close the article"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        <span className="aq-blogart-kicker">
          <BookOpen size={13} aria-hidden="true" /> Aquakart reads
        </span>
        <a
          className="aq-blogart-ext"
          href={read.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on blog <ExternalLink size={12} aria-hidden="true" />
        </a>
        <span
          className="aq-blogart-progress"
          ref={progress}
          aria-hidden="true"
        />
      </div>

      <div className="aq-split">
        <div className="aq-split-main">
          <header className="aq-blogart-head">
            {read.image && (
              <div className="aq-blogart-hero">
                <img src={read.image} alt="" />
              </div>
            )}
            <h2 id="aq-blogart-title" className="aq-display aq-blogart-title">
              {read.title}
            </h2>
            <div className="aq-blogart-meta">
              <span className="aq-blogart-chip">
                <Clock size={13} aria-hidden="true" />
                {read.minutes} min read
              </span>
              {speakable && (
                <button
                  type="button"
                  className="aq-blogart-listen"
                  aria-pressed={playing}
                  onClick={() =>
                    playing
                      ? stopSpeaking()
                      : speak(podcastId, podcastScript(read))
                  }
                >
                  {playing ? (
                    <>
                      <Square
                        size={11}
                        fill="currentColor"
                        aria-hidden="true"
                      />
                      Stop listening
                      <span className="aq-read-eq" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                    </>
                  ) : (
                    <>
                      <Headphones size={14} aria-hidden="true" />
                      Listen · {read.minutes} min
                    </>
                  )}
                </button>
              )}
            </div>
            {read.summary && <p className="aq-blogart-lead">{read.summary}</p>}
          </header>

          {read.highlights.length > 0 && (
            <aside className="aq-blogart-takeaways" aria-label="Key takeaways">
              <h3>Key takeaways</h3>
              <ul>
                {read.highlights.map((h) => (
                  <li key={h}>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div className="aq-blogart-body">
            {body.map((b, i) =>
              b.kind === "ul" ? (
                <ul key={i}>
                  {b.items.map((t, j) => (
                    <li key={j}>{t}</li>
                  ))}
                </ul>
              ) : b.kind === "h" ? (
                <h3 key={i} id={headingId(i)}>
                  {b.text}
                </h3>
              ) : b.kind === "quote" ? (
                <blockquote key={i}>{b.text}</blockquote>
              ) : (
                <p key={i}>{b.text}</p>
              ),
            )}
          </div>

          {p.onAsk && (
            <button
              type="button"
              className="aq-blogart-ask"
              onClick={() =>
                p.onAsk?.(
                  `I just read "${read.title}". What does it mean for my home?`,
                )
              }
            >
              <span className="aq-blogart-ask-icon" aria-hidden="true">
                <MessageCircle size={17} />
              </span>
              <span className="aq-blogart-ask-text">
                <b>Have a question about this?</b>
                <span>Ask Aqua what it means for your home</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}

          {/* Narrow panels: products and more reads follow the article. */}
          {products.length > 0 && (
            <section
              className="aq-blogart-section aq-split-inline"
              aria-label="Shop this read"
            >
              <div className="aq-blogart-section-head">
                <h3>Shop this read</h3>
                <span>
                  {products.length}{" "}
                  {products.length === 1 ? "product" : "products"} from the
                  catalogue
                </span>
              </div>
              <div className="aq-blogart-products">
                {products.map(p.renderProduct)}
              </div>
            </section>
          )}

          {reads.length > 0 && (
            <section
              className="aq-blogart-section aq-split-inline"
              aria-label="Keep reading"
            >
              <div className="aq-blogart-section-head">
                <h3>Keep reading</h3>
                <span>More on this from the Aquakart blog</span>
              </div>
              <div className="aq-blogart-reads">
                {reads.map((r) => readCard(r))}
              </div>
            </section>
          )}
        </div>

        {/* Wide panels: a sticky rail beside the article. */}
        <aside className="aq-split-rail" aria-label="More from this read">
          {products.length > 0 && (
            <section className="aq-rail-card aq-rail-shop">
              <h3 className="aq-rail-title">
                <Sparkles size={14} aria-hidden="true" />
                Shop this read
                <span className="aq-rail-count">{products.length}</span>
              </h3>
              <ul className="aq-rail-products">
                {products.map((v) => {
                  const off =
                    v.mrp > v.price
                      ? Math.round(((v.mrp - v.price) / v.mrp) * 100)
                      : 0;
                  const inCart = cartIds.includes(v.id);
                  return (
                    <li key={v.id} className="aq-rail-product">
                      <button
                        type="button"
                        className="aq-rail-product-main"
                        onClick={() => p.onOpenProduct?.(v.id)}
                        disabled={!p.onOpenProduct}
                        aria-label={`View ${v.title}`}
                      >
                        <span
                          className="aq-rail-product-img"
                          aria-hidden="true"
                        >
                          {v.photos[0] ? (
                            <img src={v.photos[0]} alt="" loading="lazy" />
                          ) : (
                            <Sparkles size={18} />
                          )}
                        </span>
                        <span className="aq-rail-product-text">
                          {v.brand && <small>{v.brand}</small>}
                          <b>{v.title}</b>
                          <span className="aq-rail-price">
                            <strong>{INR(v.price)}</strong>
                            {off > 0 && (
                              <>
                                <s>{INR(v.mrp)}</s>
                                <em>{off}% off</em>
                              </>
                            )}
                          </span>
                          {!v.inStock && (
                            <span className="aq-rail-oos">Out of stock</span>
                          )}
                        </span>
                      </button>
                      {p.onAddToCart && (
                        <button
                          type="button"
                          className="aq-rail-cart"
                          data-on={inCart || undefined}
                          disabled={!v.inStock}
                          onClick={() => p.onAddToCart?.(v.id)}
                          aria-label={
                            inCart
                              ? `${v.title} is in your cart, add one more`
                              : `Add ${v.title} to cart`
                          }
                          title={
                            !v.inStock
                              ? "Out of stock"
                              : inCart
                                ? "In your cart"
                                : "Add to cart"
                          }
                        >
                          {inCart ? (
                            <Check size={15} aria-hidden="true" />
                          ) : (
                            <ShoppingCart size={15} aria-hidden="true" />
                          )}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {toc.length > 1 && (
            <nav className="aq-rail-card aq-rail-toc" aria-label="On this page">
              <h3 className="aq-rail-title">
                <ListTree size={14} aria-hidden="true" />
                On this page
              </h3>
              <ol>
                {toc.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      aria-current={active === t.id ? "location" : undefined}
                      onClick={() => jump(t.id)}
                    >
                      {t.text}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {reads.length > 0 && (
            <section className="aq-rail-card">
              <h3 className="aq-rail-title">
                <BookOpen size={14} aria-hidden="true" />
                Keep reading
              </h3>
              <div className="aq-rail-reads">
                {reads.map((r) => readCard(r, true))}
              </div>
              <a className="aq-rail-more" href={BLOG_URL}>
                All Aquakart reads <ArrowRight size={13} aria-hidden="true" />
              </a>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
