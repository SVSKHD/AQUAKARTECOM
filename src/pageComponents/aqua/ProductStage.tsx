"use client";

import {
  ArrowRight,
  BookOpen,
  Building2,
  Droplets,
  Home,
  MessageCircle,
  Scale,
  Sparkles,
} from "lucide-react";
import ProductCard from "./ProductCard";
import ReadCard from "./ReadCard";
import { INR } from "./catalogue";
import { BLOG_URL, openBlogInArtifact, type BlogRead } from "./blogReads";
import { chatProducts } from "./replyProducts";
import type { ChatMessage, Product } from "./types";

type Props = {
  messages: ChatMessage[];
  products: Map<string, Product>;
  reasons: Record<string, string>;
  favIds: string[];
  cartIds: string[];
  compare: string[];
  compareHint: boolean;
  selectedId: string | null;
  busy: boolean;
  onOpen: (id: string) => void;
  onToggleFav: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onAddToCart: (id: string) => void;
  onCompare: () => void;
  // Sends a starter question to the chat.
  onAsk?: (text: string) => void;
  // Aqua's latest answer is waiting on its quick questions.
  awaitingAnswers?: boolean;
  // The newest blog posts: they open in this box.
  reads?: BlogRead[];
};

// One-tap questions while there's nothing to show yet.
const STARTERS = [
  {
    icon: <Home size={17} />,
    title: "Villa or independent house",
    text: "Which softener for a villa with 4 bathrooms on borewell?",
  },
  {
    icon: <Building2 size={17} />,
    title: "Flat or apartment",
    text: "Which softener for a 2 bathroom apartment?",
  },
  {
    icon: <Droplets size={17} />,
    title: "Drinking water",
    text: "Which RO purifier suits borewell water?",
  },
];

// Next questions once there are picks, asked in the chat.
const FOLLOW_UPS = [
  "Which of these suits my home best?",
  "What does installation cost?",
  "How often does it need servicing?",
];

// The products of the latest answer that has some (its comparison, then its
// cards), newest answer first.
function latestIds(messages: ChatMessage[], known: Map<string, Product>) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role !== "aqua") continue;
    const ids = [...(m.table || []), ...(m.products || [])].filter(
      (id, j, a) => known.has(id) && a.indexOf(id) === j,
    );
    if (ids.length) return ids;
  }
  return [];
}

// Desktop, while the chat floats in its window: the page shows what Aqua has
// suggested so far, the latest answer's products first, ready to compare,
// favourite or buy.
export default function ProductStage(p: Props) {
  const all = chatProducts(p.messages, [...p.products.values()]);
  const latest = latestIds(p.messages, p.products);
  const earlier = all.filter((id) => !latest.includes(id));
  const card = (id: string, i: number) => {
    const product = p.products.get(id);
    if (!product) return null;
    return (
      <ProductCard
        key={id}
        product={product}
        delay={Math.min(i, 8) * 0.05}
        reason={p.reasons[id]}
        selected={p.selectedId === id}
        isFav={p.favIds.includes(id)}
        inCart={p.cartIds.includes(id)}
        inCompare={p.compare.includes(id)}
        hintCompare={p.compareHint}
        onOpen={p.onOpen}
        onToggleFav={p.onToggleFav}
        onToggleCompare={p.onToggleCompare}
        onAddToCart={p.onAddToCart}
      />
    );
  };
  const picked = p.compare.length;
  // Nothing suggested yet: a few in-stock products to look at meanwhile
  // (softeners first, the biggest offers first).
  const featured = all.length
    ? []
    : [...p.products.values()]
        .filter((x) => x.inStock)
        .sort(
          (a, b) =>
            Number(b.cat === "softener") - Number(a.cat === "softener") ||
            b.mrp - b.price - (a.mrp - a.price),
        )
        .slice(0, 4)
        .map((x) => x.id);

  const picks = all.flatMap((id) => {
    const x = p.products.get(id);
    return x ? [x] : [];
  });
  const prices = picks.map((x) => x.price).filter((n) => n > 0);
  const inStock = picks.filter((x) => x.inStock).length;
  const kicker = (label: string, count: number) => (
    <h3 className="aq-stage-kicker">
      {label}
      <span className="aq-rail-count">{count}</span>
    </h3>
  );

  return (
    <div className="aq-stage aq-noscroll">
      <div className="aq-split">
        <div className="aq-split-main">
          <header className="aq-stage-head">
            <div>
              <span className="aq-stage-eyebrow">
                <Sparkles size={13} aria-hidden="true" /> Aqua&apos;s picks
              </span>
              <h2 className="aq-display aq-stage-title">
                {all.length ? "Picked for you" : "Your picks land here"}
              </h2>
              <p className="aq-stage-sub">
                {all.length
                  ? `${all.length} ${all.length === 1 ? "product" : "products"} from your chat with Aqua`
                  : p.busy
                    ? "Aqua is looking through the catalogue…"
                    : p.awaitingAnswers
                      ? "Answer Aqua's quick questions on the left. It sizes the softener and puts the picks here."
                      : "Ask Aqua anything on the left. What it suggests shows up here, side by side."}
              </p>
            </div>
            {all.length > 1 && (
              <button
                type="button"
                className="aq-stage-compare"
                data-ready={picked >= 2}
                onClick={p.onCompare}
              >
                <Scale size={15} aria-hidden="true" />
                {picked >= 2
                  ? `Compare ${picked}`
                  : picked === 1
                    ? "Pick 1 more to compare"
                    : "Tap ⇄ to compare"}
                {picked >= 2 && <ArrowRight size={15} aria-hidden="true" />}
              </button>
            )}
          </header>

          {!all.length ? (
            <div className="aq-stage-empty">
              {/* Where the picks will land: placeholders, shimmering while Aqua works. */}
              <div
                className="aq-stage-ghosts"
                data-live={p.busy || !!p.awaitingAnswers}
                aria-hidden="true"
              >
                {[0, 1, 2].map((i) => (
                  <span key={i} className="aq-stage-ghost">
                    <i />
                    <b />
                    <b />
                    <em />
                  </span>
                ))}
              </div>
              {p.onAsk && (
                <section aria-label="Start with a question">
                  <h3 className="aq-stage-kicker">Start with a question</h3>
                  <div className="aq-stage-starters">
                    {STARTERS.map((st) => (
                      <button
                        key={st.title}
                        type="button"
                        className="aq-stage-starter"
                        disabled={p.busy}
                        onClick={() => p.onAsk?.(st.text)}
                      >
                        <span
                          className="aq-stage-starter-icon"
                          aria-hidden="true"
                        >
                          {st.icon}
                        </span>
                        <span className="aq-stage-starter-text">
                          <b>{st.title}</b>
                          <span>{st.text}</span>
                        </span>
                        <ArrowRight size={15} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {featured.length > 0 && (
                <section aria-label="In stock now">
                  {kicker("In stock now", featured.length)}
                  <div className="aq-stage-grid">{featured.map(card)}</div>
                </section>
              )}
            </div>
          ) : (
            <>
              {latest.length > 0 && (
                <section aria-label="From Aqua's latest answer">
                  {kicker("Latest answer", latest.length)}
                  <div className="aq-stage-grid">{latest.map(card)}</div>
                </section>
              )}
              {earlier.length > 0 && (
                <section aria-label="Earlier in this chat">
                  {kicker("Earlier in this chat", earlier.length)}
                  <div className="aq-stage-grid">
                    {earlier.map((id, i) => card(id, i + latest.length))}
                  </div>
                </section>
              )}
            </>
          )}
          {!!p.reads?.length && (
            <section
              className="aq-stage-reads aq-split-inline"
              aria-label="Water reads"
            >
              <h3 className="aq-stage-kicker">
                <BookOpen size={12} aria-hidden="true" /> Water reads
              </h3>
              <div className="aq-blogart-reads">
                {p.reads.map((r) => (
                  <ReadCard key={r.id} read={r} onOpen={openBlogInArtifact} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Wide panels: the same sticky rail as the blog reader. */}
        <aside className="aq-split-rail" aria-label="About your picks">
          {picks.length > 0 && (
            <section className="aq-rail-card">
              <h3 className="aq-rail-title">
                <Sparkles size={14} aria-hidden="true" />
                At a glance
              </h3>
              <dl className="aq-rail-stats">
                <div>
                  <dt>Picks</dt>
                  <dd>{picks.length}</dd>
                </div>
                <div>
                  <dt>In stock</dt>
                  <dd>
                    {inStock}
                    <small> of {picks.length}</small>
                  </dd>
                </div>
                {prices.length > 0 && (
                  <div className="aq-rail-stat-wide">
                    <dt>Price range</dt>
                    <dd>
                      {Math.min(...prices) === Math.max(...prices)
                        ? INR(prices[0])
                        : `${INR(Math.min(...prices))} – ${INR(Math.max(...prices))}`}
                    </dd>
                  </div>
                )}
              </dl>
              {picks.length > 1 && (
                <p className="aq-rail-hint">
                  <Scale size={13} aria-hidden="true" />
                  {picked >= 2
                    ? `${picked} picked: compare them from the top.`
                    : picked === 1
                      ? "1 picked. Tap ⇄ on one more card to compare."
                      : "Tap ⇄ on two cards to compare them side by side."}
                </p>
              )}
            </section>
          )}

          {picks.length > 0 && p.onAsk && (
            <section className="aq-rail-card">
              <h3 className="aq-rail-title">
                <MessageCircle size={14} aria-hidden="true" />
                Ask Aqua next
              </h3>
              <div className="aq-rail-asks">
                {FOLLOW_UPS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="aq-rail-ask"
                    disabled={p.busy}
                    onClick={() => p.onAsk?.(q)}
                  >
                    <span>{q}</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {!!p.reads?.length && (
            <section className="aq-rail-card">
              <h3 className="aq-rail-title">
                <BookOpen size={14} aria-hidden="true" />
                Water reads
              </h3>
              <div className="aq-rail-reads">
                {p.reads.map((r) => (
                  <ReadCard
                    key={r.id}
                    read={r}
                    rail
                    onOpen={openBlogInArtifact}
                  />
                ))}
              </div>
              <a className="aq-rail-more" href={BLOG_URL}>
                All Aquakart reads <ArrowRight size={13} aria-hidden="true" />
              </a>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
