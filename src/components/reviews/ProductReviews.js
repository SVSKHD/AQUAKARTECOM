import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Star,
  Loader2,
  Trash2,
  Pencil,
  MessageSquare,
  User,
  ChevronDown,
} from "lucide-react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
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
  const buttonRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review?.rating || 0);
  const [editComment, setEditComment] = useState(review?.comment || "");

  const startEdit = (isOpen) => {
    setEditRating(review?.rating || 0);
    setEditComment(review?.comment || "");
    setIsEditing(true);
    if (!isOpen) buttonRef.current?.click();
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
    <Disclosure
      as="div"
      className="glass-card rounded-2xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
    >
      {({ open }) => (
        <>
          <DisclosureButton
            ref={buttonRef}
            className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left focus:outline-none"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm font-bold flex-shrink-0">
                {displayName?.[0]?.toUpperCase() || (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {displayName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating value={review?.rating || 0} size="sm" />
                  {date && (
                    <span className="text-[11px] text-slate-400">{date}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isOwner && (
                <>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!updating && !deleting) startEdit(open);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!updating && !deleting) startEdit(open);
                      }
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition active:scale-90 ${
                      updating || deleting
                        ? "pointer-events-none opacity-60"
                        : ""
                    }`}
                    aria-label="Edit review"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!deleting && !updating) onDelete(review?._id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!deleting && !updating) onDelete(review?._id);
                      }
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition active:scale-90 ${
                      deleting || updating
                        ? "pointer-events-none opacity-60"
                        : ""
                    }`}
                    aria-label="Delete review"
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </span>
                </>
              )}
              <ChevronDown
                className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
          </DisclosureButton>
          <DisclosurePanel className="px-4 sm:px-5 pb-4 sm:pb-5">
            <div className="border-t border-white/40 pt-3">
              {isEditing && isOwner ? (
                <form onSubmit={submitEdit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Rating
                    </label>
                    <StarRating
                      value={editRating}
                      onChange={setEditRating}
                      size="md"
                      interactive
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`edit-comment-${review?._id}`}
                      className="block text-xs font-semibold text-slate-600 mb-1.5"
                    >
                      Your review
                    </label>
                    <textarea
                      id={`edit-comment-${review?._id}`}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      placeholder="Share the details of your experience..."
                      rows={4}
                      maxLength={1000}
                      className="w-full rounded-xl border border-white/50 bg-white/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={updating || editRating === 0}
                      className={`btn-glass flex items-center gap-2 ${
                        updating || editRating === 0
                          ? "bg-slate-100/60 text-slate-400 cursor-not-allowed"
                          : "btn-glass-primary"
                      }`}
                    >
                      {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                      {updating ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={updating}
                      className="btn-glass btn-glass-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : review?.comment ? (
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {review.comment}
                </p>
              ) : (
                <p className="text-sm italic text-slate-400">
                  No comment provided.
                </p>
              )}
            </div>
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
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
    fetchReviews();
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
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-emerald-600" />
        <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
      </div>

      <div className="space-y-4">
        {/* Write review button */}
        {token ? (
          <button
            type="button"
            onClick={() => setShowForm((p) => !p)}
            className="btn-glass btn-glass-primary"
          >
            {existingReview ? "Update your review" : "Write a review"}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400">Sign in to leave a review</p>
            <button
              type="button"
              onClick={openAuthDialog}
              className="btn-glass btn-glass-primary !px-4 !py-2 text-xs"
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
            <div className="space-y-3">
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
