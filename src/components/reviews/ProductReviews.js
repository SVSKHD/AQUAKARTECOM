import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Star,
  Loader2,
  Trash2,
  Pencil,
  MessageSquare,
  Quote,
  User,
  BadgeCheck,
} from "lucide-react";
import ProductServiceOperations from "@/services/products";
import AquaToast from "@/components/reusables/react-toastify";
import useDialog from "@/utils/dialog";

const STARS = [1, 2, 3, 4, 5];

const StarRating = ({
  value = 0,
  onChange,
  size = "md",
  interactive = false,
}) => {
  const [hover, setHover] = useState(0);
  const sizeClass =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={
            interactive
              ? "cursor-pointer transition-transform hover:scale-110 active:scale-95"
              : "cursor-default"
          }
        >
          <Star
            className={`${sizeClass} transition-colors ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const resolveReviewerName = (review) => {
  const raw = review?.userName || review?.name || review?.email || "";
  if (!raw) return "Anonymous";
  return raw.includes("@") ? raw.split("@")[0] : raw;
};

const ReviewCard = ({
  review,
  currentUserId,
  onDelete,
  deleting,
  onUpdate,
  updating,
}) => {
  const isOwner = currentUserId && review?.user === currentUserId;
  const date = review?.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  const displayName = resolveReviewerName(review);
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review?.rating || 0);
  const [editComment, setEditComment] = useState(review?.comment || "");

  const startEdit = () => {
    setEditRating(review?.rating || 0);
    setEditComment(review?.comment || "");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditRating(review?.rating || 0);
    setEditComment(review?.comment || "");
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const success = await onUpdate?.(review?._id, {
      rating: editRating,
      comment: editComment,
    });
    if (success) setIsEditing(false);
  };

  return (
    <article className="relative overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/82 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_65px_rgba(15,23,42,0.1)] sm:p-5">
      <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-black text-white shadow-lg shadow-emerald-500/20">
          {displayName?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 sm:text-base">
                {displayName}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                {review?.verifiedPurchase ? (
                  <BadgeCheck className="h-3 w-3" />
                ) : null}
                {review?.verifiedPurchase
                  ? "Verified purchase"
                  : "Aquakart customer"}
              </p>
            </div>
            {isOwner && (
              <div className="flex flex-none items-center gap-1">
                <button
                  type="button"
                  onClick={() => !updating && !deleting && startEdit()}
                  disabled={updating || deleting}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                  aria-label="Edit review"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    !deleting && !updating && onDelete(review?._id)
                  }
                  disabled={deleting || updating}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                  aria-label="Delete review"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StarRating value={review?.rating || 0} size="sm" />
            {date && (
              <span className="text-[10px] font-semibold text-slate-400">
                {date}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-4 border-t border-slate-100 pt-4">
        {isEditing && isOwner ? (
          <form onSubmit={submitEdit} className="space-y-3">
            <StarRating
              value={editRating}
              onChange={setEditRating}
              size="md"
              interactive
            />
            <textarea
              id={`edit-comment-${review?._id}`}
              value={editComment}
              onChange={(event) => setEditComment(event.target.value)}
              placeholder="Share the details of your experience..."
              rows={4}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white/75 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={updating || editRating === 0}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={updating}
                className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : review?.comment ? (
          <div className="flex gap-2.5">
            <Quote className="mt-0.5 h-4 w-4 flex-none fill-emerald-100 text-emerald-500" />
            <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
              {review.comment}
            </p>
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-400">
            Rating shared without a written note.
          </p>
        )}
      </div>
    </article>
  );
};

const ProductReviews = ({
  productId,
  reviews: externalReviews,
  loading: externalLoading,
  onReviewsChange,
}) => {
  const userData = useSelector((state) => state.userData);
  const token = userData?.token;
  const userId = userData?.user?._id;
  const userName =
    userData?.user?.name || userData?.user?.email?.split("@")[0] || "";

  const { openAuthDialog } = useDialog();

  const isControlled = Array.isArray(externalReviews);

  const [internalReviews, setInternalReviews] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const reviews = isControlled ? externalReviews : internalReviews;
  const loading = isControlled ? !!externalLoading : internalLoading;
  const reviewSummary = useMemo(() => {
    const total = reviews.length;
    const average = total
      ? reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0) /
        total
      : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter(
        (review) => Math.round(Number(review?.rating || 0)) === star,
      ).length;
      return {
        star,
        count,
        percent: total ? Math.round((count / total) * 100) : 0,
      };
    });
    return { total, average, distribution };
  }, [reviews]);

  const fetchReviews = useCallback(async () => {
    if (isControlled) {
      await onReviewsChange?.();
      return;
    }
    if (!productId) return;
    try {
      const res = await ProductServiceOperations.GetProductReviews(productId);
      const payload = res?.data?.data || res?.data || {};
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.reviews)
          ? payload.reviews
          : [];
      setInternalReviews(list);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setInternalLoading(false);
    }
  }, [productId, isControlled, onReviewsChange]);

  useEffect(() => {
    if (isControlled) return;
    const frame = window.requestAnimationFrame(() => {
      void fetchReviews();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fetchReviews, isControlled]);

  const existingReview = useMemo(
    () => (userId ? reviews.find((r) => r?.user === userId) : null),
    [reviews, userId],
  );

  const resetForm = () => {
    setRating(0);
    setComment("");
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      AquaToast({ message: "Please sign in to leave a review", type: "error" });
      return;
    }
    if (rating === 0) {
      AquaToast({ message: "Please select a rating", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await ProductServiceOperations.AddProductReview(
        productId,
        { rating, comment: comment.trim(), userName },
        token,
      );
      AquaToast({
        message: existingReview ? "Review updated" : "Review posted",
        type: "success",
      });
      resetForm();
      await fetchReviews();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit review";
      AquaToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!token || !reviewId) return;
    setDeletingId(reviewId);
    try {
      await ProductServiceOperations.DeleteProductReview(
        productId,
        reviewId,
        token,
      );
      AquaToast({ message: "Review deleted", type: "success" });
      await fetchReviews();
    } catch (err) {
      AquaToast({ message: "Failed to delete review", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (reviewId, data) => {
    if (!token) {
      AquaToast({
        message: "Please sign in to edit your review",
        type: "error",
      });
      return false;
    }
    if (!reviewId) return false;
    if (!data?.rating) {
      AquaToast({ message: "Please select a rating", type: "error" });
      return false;
    }
    setUpdatingId(reviewId);
    try {
      await ProductServiceOperations.UpdateProductReview(
        productId,
        {
          reviewId,
          rating: data.rating,
          comment: (data.comment || "").trim(),
          userName,
        },
        token,
      );
      AquaToast({ message: "Review updated", type: "success" });
      await fetchReviews();
      return true;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update review";
      AquaToast({ message: msg, type: "error" });
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section>
      <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#020617_0%,#0f172a_62%,#064e3b_145%)] p-5 text-white shadow-[0_26px_80px_rgba(15,23,42,0.2)] sm:p-7">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 ring-1 ring-white/10">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
              Real experiences
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Customer reviews
            </h2>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-[auto_1fr] items-center gap-5 sm:grid-cols-[auto_1fr_auto] sm:gap-8">
          <div>
            <p className="text-5xl font-black tracking-[-0.06em]">
              {reviewSummary.total ? reviewSummary.average.toFixed(1) : "—"}
            </p>
            <div className="mt-2">
              <StarRating value={Math.round(reviewSummary.average)} size="sm" />
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              {reviewSummary.total}{" "}
              {reviewSummary.total === 1 ? "review" : "reviews"}
            </p>
          </div>

          <div className="space-y-1.5">
            {reviewSummary.distribution.map((row) => (
              <div
                key={row.star}
                className="grid grid-cols-[1rem_1fr_1.6rem] items-center gap-2"
              >
                <span className="text-[10px] font-black text-white/55">
                  {row.star}
                </span>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
                <span className="text-right text-[9px] font-bold text-white/35">
                  {row.count}
                </span>
              </div>
            ))}
          </div>

          <p className="hidden max-w-[13rem] text-xs leading-5 text-white/50 sm:block">
            Product feedback from Aquakart customers, shown openly to help you
            choose with confidence.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Write review button */}
        {token ? (
          <button
            type="button"
            onClick={() => setShowForm((p) => !p)}
            className="inline-flex h-11 items-center rounded-full bg-emerald-600 px-5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700"
          >
            {existingReview ? "Update your review" : "Write a review"}
          </button>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/65 p-3 pl-4 shadow-sm backdrop-blur-xl">
            <div>
              <p className="text-xs font-black text-slate-800">
                Used this product?
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Sign in and share your experience.
              </p>
            </div>
            <button
              type="button"
              onClick={openAuthDialog}
              className="h-10 flex-none rounded-full bg-emerald-600 px-5 text-xs font-black text-white shadow-lg shadow-emerald-500/20"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Reviews list + form */}
        <div className="space-y-4">
          {/* Write form */}
          {showForm && token && (
            <form
              onSubmit={handleSubmit}
              className="glass-tint-emerald rounded-2xl p-5 sm:p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-800">
                {existingReview ? "Update your review" : "Write a review"}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Rating
                </label>
                <StarRating
                  value={rating}
                  onChange={setRating}
                  size="lg"
                  interactive
                />
              </div>

              <div>
                <label
                  htmlFor="review-comment"
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Your review
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share the details of your experience — what you liked, what stood out, anything others should know..."
                  rows={5}
                  maxLength={1000}
                  className="w-full rounded-xl border border-white/50 bg-white/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className={`btn-glass flex items-center gap-2 ${
                    submitting || rating === 0
                      ? "bg-slate-100/60 text-slate-400 cursor-not-allowed"
                      : "btn-glass-primary"
                  }`}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting
                    ? "Posting..."
                    : existingReview
                      ? "Update"
                      : "Post Review"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-glass btn-glass-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews list */}
          {loading ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
              <p className="text-sm text-slate-500 mt-2">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="glass-subtle rounded-2xl border border-dashed border-white/40 p-10 text-center">
              <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">
                No reviews yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Be the first to share your experience with this product.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {reviews.map((review) => (
                <ReviewCard
                  key={review?._id || review?.createdAt}
                  review={review}
                  currentUserId={userId}
                  onDelete={handleDelete}
                  deleting={deletingId === review?._id}
                  onUpdate={handleUpdate}
                  updating={updatingId === review?._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
