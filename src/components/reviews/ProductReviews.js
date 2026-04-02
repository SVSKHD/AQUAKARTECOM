import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { Star, Loader2, Trash2, MessageSquare, User } from "lucide-react";
import ProductServiceOperations from "@/services/products";
import AquaToast from "@/components/reusables/react-toastify";

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

const RatingBar = ({ stars, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right font-semibold text-slate-600">
        {stars}
      </span>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-slate-400">{count}</span>
    </div>
  );
};

const ReviewCard = ({ review, currentUserId, onDelete, deleting }) => {
  const isOwner = currentUserId && review?.user === currentUserId;
  const date = review?.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-bold flex-shrink-0">
            {review?.userName?.[0]?.toUpperCase() || (
              <User className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {review?.userName || "Anonymous"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating value={review?.rating || 0} size="sm" />
              {date && (
                <span className="text-[11px] text-slate-400">{date}</span>
              )}
            </div>
          </div>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => onDelete(review?._id)}
            disabled={deleting}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition active:scale-90"
            aria-label="Delete review"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
      {review?.title && (
        <p className="mt-2 text-sm font-semibold text-slate-800">
          {review.title}
        </p>
      )}
      {review?.comment && (
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
};

const ProductReviews = ({ productId }) => {
  const userData = useSelector((state) => state.userData);
  const token = userData?.token;
  const userId = userData?.user?._id;
  const userName =
    userData?.user?.name || userData?.user?.email?.split("@")[0] || "";

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await ProductServiceOperations.GetProductReviews(productId);
      const data = res?.data?.data || res?.data || [];
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, total: 0, dist: {} };
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (r?.rating || 0), 0);
    const dist = {};
    STARS.forEach((s) => {
      dist[s] = reviews.filter((r) => r?.rating === s).length;
    });
    return { avg: Math.round((sum / total) * 10) / 10, total, dist };
  }, [reviews]);

  const existingReview = useMemo(
    () => (userId ? reviews.find((r) => r?.user === userId) : null),
    [reviews, userId],
  );

  const resetForm = () => {
    setRating(0);
    setTitle("");
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
        { rating, title: title.trim(), comment: comment.trim(), userName },
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

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-emerald-600" />
        <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Summary panel */}
        <div className="glass-tint-amber rounded-2xl p-5 sm:p-6 h-fit lg:sticky lg:top-28">
          <div className="text-center mb-4">
            <p className="text-5xl font-black text-slate-900">
              {stats.avg || "—"}
            </p>
            <StarRating value={Math.round(stats.avg)} size="md" />
            <p className="text-xs text-slate-500 mt-1">
              {stats.total} {stats.total === 1 ? "review" : "reviews"}
            </p>
          </div>

          <div className="space-y-1.5">
            {[...STARS].reverse().map((s) => (
              <RatingBar
                key={s}
                stars={s}
                count={stats.dist[s] || 0}
                total={stats.total}
              />
            ))}
          </div>

          {/* Write review button */}
          {token ? (
            <button
              type="button"
              onClick={() => setShowForm((p) => !p)}
              className="btn-glass btn-glass-primary w-full mt-5"
            >
              {existingReview ? "Update your review" : "Write a review"}
            </button>
          ) : (
            <p className="mt-5 text-center text-xs text-slate-400">
              Sign in to leave a review
            </p>
          )}
        </div>

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
                  htmlFor="review-title"
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Title (optional)
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sum it up in a few words"
                  maxLength={100}
                  className="w-full rounded-xl border border-white/50 bg-white/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all"
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
                  placeholder="Share your experience with this product..."
                  rows={3}
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
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard
                  key={review?._id || review?.createdAt}
                  review={review}
                  currentUserId={userId}
                  onDelete={handleDelete}
                  deleting={deletingId === review?._id}
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
