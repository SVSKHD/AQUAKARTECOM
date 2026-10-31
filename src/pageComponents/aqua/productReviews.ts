import { getProductReviewStats } from "@/utils/reviewStats";
import type { Product } from "./types";

// Ratings and reviews as the catalogue API sends them on each product
// (ratings, numberOfReviews, reviews[]). Demo products have none.

export type ReviewQuote = { name: string; rating: number; comment: string };
export type ProductReviews = {
  rating: number | null;
  count: number;
  top: ReviewQuote[];
};

const str = (v: unknown) => (v == null ? "" : String(v).trim());
const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ");

export function productReviews(p: Product): ProductReviews {
  const raw = p.raw || {};
  const stats = getProductReviewStats(raw);
  const list = Array.isArray(raw.reviews)
    ? (raw.reviews as Record<string, unknown>[])
    : [];
  // The most helpful-looking first: higher rating, then the longer comment.
  const top = list
    .map((r) => ({
      name: str(r.name) || "Customer",
      rating: Math.max(1, Math.min(5, Number(r.rating) || 0)),
      comment: str(r.comment),
    }))
    .filter((r) => r.comment)
    // The same text posted twice shows once.
    .filter(
      (r, i, all) =>
        all.findIndex((o) => norm(o.comment) === norm(r.comment)) === i,
    )
    .sort((a, b) => b.rating - a.rating || b.comment.length - a.comment.length)
    .slice(0, 2);
  return {
    rating: stats.ratingValue ? Math.round(stats.ratingValue * 10) / 10 : null,
    count: stats.ratingCount || 0,
    top,
  };
}
