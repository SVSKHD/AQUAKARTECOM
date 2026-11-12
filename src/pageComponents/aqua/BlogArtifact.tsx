"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Headphones,
  MessageCircle,
  Square,
} from "lucide-react";
import {
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
  // A product card, rendered by the workspace with its cart / compare actions.
  renderProduct: (p: Product, index: number) => ReactNode;
  onOpenRead: (read: BlogRead) => void;
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
// products it's about and more posts on the subject.
export default function BlogArtifact(p: Props) {
  const { read } = p;
  const scroller = useRef<HTMLElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const podcastId = `blog:${read.id}`;
  const playing = useSpeaking(podcastId);
  const speakable = canSpeak();
  const products = relatedProducts(read, p.products);
  const reads = relatedReads(read, p.allReads);
  const body = group(
    read.blocks?.length
      ? read.blocks
      : read.paragraphs.map((text) => ({ kind: "p" as const, text })),
  );

  // A new post starts at its top; leaving it stops its podcast (only its own).
  useEffect(() => {
    scroller.current?.scrollTo?.({ top: 0 });
    progress.current?.style.setProperty("--aq-read", "0");
  }, [read.id]);
  useEffect(
    () => () => {
      if (speakingNow() === podcastId) stopSpeaking();
    },
    [podcastId],
  );

  // Reading progress, straight on the bar (no re-render per scroll).
  const onScroll = () => {
    const el = scroller.current;
    if (!el || !progress.current) return;
    const max = el.scrollHeight - el.clientHeight;
    progress.current.style.setProperty(
      "--aq-read",
      String(max > 0 ? Math.min(1, el.scrollTop / max) : 1),
    );
  };

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
                playing ? stopSpeaking() : speak(podcastId, podcastScript(read))
              }
            >
              {playing ? (
                <>
                  <Square size={11} fill="currentColor" aria-hidden="true" />
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
            <h3 key={i}>{b.text}</h3>
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

      {products.length > 0 && (
        <section className="aq-blogart-section" aria-label="Shop this read">
          <div className="aq-blogart-section-head">
            <h3>Shop this read</h3>
            <span>
              {products.length} {products.length === 1 ? "product" : "products"}{" "}
              from the catalogue
            </span>
          </div>
          <div className="aq-blogart-products">
            {products.map(p.renderProduct)}
          </div>
        </section>
      )}

      {reads.length > 0 && (
        <section className="aq-blogart-section" aria-label="Keep reading">
          <div className="aq-blogart-section-head">
            <h3>Keep reading</h3>
            <span>More on this from the Aquakart blog</span>
          </div>
          <div className="aq-blogart-reads">
            {reads.map((r) => (
              <button
                key={r.id}
                type="button"
                className="aq-blogart-read"
                onClick={() => p.onOpenRead(r)}
              >
                <span className="aq-blogart-read-img" aria-hidden="true">
                  {r.image ? (
                    <img src={r.image} alt="" loading="lazy" />
                  ) : (
                    <BookOpen size={20} />
                  )}
                </span>
                <span className="aq-blogart-read-text">
                  <b>{r.title}</b>
                  <span>
                    {r.minutes} min read
                    <ArrowRight size={12} aria-hidden="true" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
