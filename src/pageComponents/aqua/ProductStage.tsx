"use client";

import {
  ArrowRight,
  BookOpen,
  Building2,
  Droplets,
  Home,
  Scale,
  Sparkles,
} from "lucide-react";
import ProductCard from "./ProductCard";
import { openBlogInArtifact, type BlogRead } from "./blogReads";
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

  return (
    <div className="aq-stage aq-noscroll">
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
                    <span className="aq-stage-starter-icon" aria-hidden="true">
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
              <h3 className="aq-stage-kicker">In stock now</h3>
              <div className="aq-stage-grid">{featured.map(card)}</div>
            </section>
          )}
        </div>
      ) : (
        <>
          {latest.length > 0 && (
            <section aria-label="From Aqua's latest answer">
              <h3 className="aq-stage-kicker">Latest answer</h3>
              <div className="aq-stage-grid">{latest.map(card)}</div>
            </section>
          )}
          {earlier.length > 0 && (
            <section aria-label="Earlier in this chat">
              <h3 className="aq-stage-kicker">Earlier in this chat</h3>
              <div className="aq-stage-grid">
                {earlier.map((id, i) => card(id, i + latest.length))}
              </div>
            </section>
          )}
        </>
      )}
      {!!p.reads?.length && (
        <section className="aq-stage-reads" aria-label="Water reads">
          <h3 className="aq-stage-kicker">
            <BookOpen size={12} aria-hidden="true" /> Water reads
          </h3>
          <div className="aq-blogart-reads">
            {p.reads.map((r) => (
              <button
                key={r.id}
                type="button"
                className="aq-blogart-read"
                onClick={() => openBlogInArtifact(r)}
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
    </div>
  );
}
