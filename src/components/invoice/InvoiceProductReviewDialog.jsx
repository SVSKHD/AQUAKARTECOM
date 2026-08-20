import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  MessageSquareHeart,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";

import InvoiceServiceOperations from "@/services/invoice";
import styles from "@/styles/invoice-review-dialog.module.css";

const InvoiceProductReviewDialog = ({ invoiceId, products, open, onClose }) => {
  const reviewable = useMemo(
    () => [
      ...new Map(
        products
          .filter((product) => product.catalogueProductId)
          .map((product) => [product.catalogueProductId, product]),
      ).values(),
    ],
    [products],
  );
  const [index, setIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState([]);
  const product = reviewable[index];

  if (!open || !product) return null;

  const moveNext = () => {
    setRating(0);
    setComment("");
    if (index < reviewable.length - 1) setIndex((current) => current + 1);
    else onClose();
  };

  const submit = async () => {
    if (!rating) {
      toast.error("Choose a star rating");
      return;
    }
    if (comment.trim().length < 3) {
      toast.error("Please write a short product review");
      return;
    }
    setSubmitting(true);
    try {
      await InvoiceServiceOperations.submitProductReview(invoiceId, {
        productId: product.catalogueProductId,
        rating,
        comment: comment.trim(),
      });
      setCompleted((current) => [...current, product.catalogueProductId]);
      toast.success("Review added to the product");
      moveNext();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not save the product review",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-review-title"
      >
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close review dialog"
        >
          <X size={19} />
        </button>

        <div className={styles.headingIcon}>
          <MessageSquareHeart size={25} />
        </div>
        <span className={styles.eyebrow}>Your verified purchase</span>
        <h2 id="invoice-review-title">How is your product working for you?</h2>
        <p>
          Your experience helps new customers choose the right water solution.
        </p>

        <div className={styles.progress}>
          {reviewable.map((item, itemIndex) => (
            <span
              key={item.catalogueProductId}
              className={
                completed.includes(item.catalogueProductId)
                  ? styles.complete
                  : itemIndex === index
                    ? styles.active
                    : ""
              }
            >
              {completed.includes(item.catalogueProductId) ? (
                <CheckCircle2 size={13} />
              ) : (
                itemIndex + 1
              )}
            </span>
          ))}
        </div>

        <div className={styles.product}>
          {product.productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.productImage} alt="" />
          ) : null}
          <div>
            <small>
              Product {index + 1} of {reviewable.length}
            </small>
            <strong>{product.productName}</strong>
            <span>
              <BadgeCheck size={13} /> Invoice-backed review
            </span>
          </div>
        </div>

        <fieldset className={styles.rating}>
          <legend>Your rating</legend>
          <div>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                <Star
                  size={30}
                  fill={value <= rating ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
        </fieldset>

        <label className={styles.comment}>
          <span>Your review</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, 1000))}
            placeholder="Tell others about product quality, performance or service…"
            rows={4}
          />
          <small>{comment.length}/1000</small>
        </label>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.skip}
            onClick={moveNext}
            disabled={submitting}
          >
            {index < reviewable.length - 1
              ? "Skip this product"
              : "Maybe later"}
          </button>
          <button
            type="button"
            className={styles.submit}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "Saving review…" : "Submit review"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default InvoiceProductReviewDialog;
