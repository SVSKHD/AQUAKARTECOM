import Link from "next/link";
import {
  ArrowRight,
  MessageSquareQuote,
  ShieldCheck,
  Star,
} from "lucide-react";

import LazyImage from "@/components/image/LazyImage";
import styles from "@/styles/home.module.css";

const cleanText = (value = "") =>
  String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const reviewerName = (review = {}) => {
  const value = cleanText(
    review.name || review.userName || "Aquakart customer",
  );
  return value.includes("@") ? value.split("@")[0] : value;
};

const productHref = (product = {}) =>
  `/product/${product.slug || product.seoSlug || product._id || product.id}`;

const productImage = (product = {}) => {
  const photo = product.photos?.[0];
  return photo?.delivery_url || photo?.secure_url || product.image || "";
};

const buildReviewFeed = (products = []) =>
  products
    .flatMap((product) =>
      (Array.isArray(product?.reviews) ? product.reviews : []).map(
        (review) => ({
          ...review,
          product,
          rating: Number(review?.rating),
          comment: cleanText(review?.comment),
        }),
      ),
    )
    .filter(
      (review) =>
        Number.isFinite(review.rating) &&
        review.rating >= 1 &&
        review.rating <= 5 &&
        review.comment.length >= 12,
    )
    .sort((left, right) => {
      const dateDifference =
        new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      return dateDifference || right.rating - left.rating;
    });

const Stars = ({ rating }) => (
  <span className={styles.reviewStars} aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={15}
        fill={star <= rating ? "currentColor" : "none"}
      />
    ))}
  </span>
);

const AquaHomeReviews = ({ products = [] }) => {
  const allReviews = buildReviewFeed(products);
  const visibleReviews = allReviews.slice(0, 6);
  if (!visibleReviews.length) return null;

  const average =
    allReviews.reduce((total, review) => total + review.rating, 0) /
    allReviews.length;

  return (
    <section className={styles.reviewsSection} aria-labelledby="reviews-title">
      <div className={styles.reviewIntro}>
        <span className={styles.sectionEyebrow}>Real product experiences</span>
        <h2 id="reviews-title">Trusted at home, reviewed by customers.</h2>
        <p>
          See what Aquakart customers say after choosing products for their
          everyday water needs.
        </p>

        <div className={styles.reviewScore}>
          <strong>{average.toFixed(1)}</strong>
          <div>
            <Stars rating={Math.round(average)} />
            <span>
              Based on {allReviews.length} product review
              {allReviews.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className={styles.reviewTrustNote}>
          <ShieldCheck size={18} />
          <span>Reviews are submitted through Aquakart product pages.</span>
        </div>

        <Link href="/shop" className={styles.reviewShopLink}>
          Explore reviewed products <ArrowRight size={16} />
        </Link>
      </div>

      <div className={styles.reviewGrid}>
        {visibleReviews.map((review, index) => {
          const image = productImage(review.product);
          return (
            <article
              key={review._id || `${review.product?._id}-${index}`}
              className={styles.reviewCard}
            >
              <div className={styles.reviewCardTop}>
                <Stars rating={Math.round(review.rating)} />
                <MessageSquareQuote size={19} />
              </div>
              <blockquote>“{review.comment}”</blockquote>
              <div className={styles.reviewerMeta}>
                <span className={styles.reviewerAvatar}>
                  {reviewerName(review).slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <strong>{reviewerName(review)}</strong>
                  <span>Aquakart customer</span>
                </div>
              </div>
              <Link
                href={productHref(review.product)}
                className={styles.reviewProduct}
              >
                {image ? (
                  <span className={styles.reviewProductImage}>
                    <LazyImage
                      src={image}
                      alt=""
                      fill
                      sizes="48px"
                      imgClassName={styles.reviewProductImageAsset}
                    />
                  </span>
                ) : null}
                <span>
                  <small>Reviewed product</small>
                  <strong>{review.product?.title || "Aquakart product"}</strong>
                </span>
                <ArrowRight size={15} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default AquaHomeReviews;
