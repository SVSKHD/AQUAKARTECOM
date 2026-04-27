export const getProductReviewStats = (product) => {
  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];

  const rawCount =
    product?.numberOfReviews ??
    (typeof product?.ratings === "object" ? product?.ratings?.count : null) ??
    (typeof product?.rating === "object" ? product?.rating?.count : null) ??
    reviews.length;

  const ratingValues = reviews
    .map((review) => Number(review?.rating ?? review?.ratingValue))
    .filter((value) => Number.isFinite(value) && value > 0);

  const averageFromReviews = ratingValues.length
    ? ratingValues.reduce((acc, value) => acc + value, 0) / ratingValues.length
    : null;

  const rawRating =
    (typeof product?.ratings === "object"
      ? product?.ratings?.value
      : product?.ratings) ??
    (typeof product?.rating === "object"
      ? product?.rating?.value
      : product?.rating) ??
    averageFromReviews;

  const ratingValue = Number(rawRating);
  const ratingCount = Number(rawCount);

  return {
    ratingValue:
      Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue : null,
    ratingCount:
      Number.isFinite(ratingCount) && ratingCount > 0 ? ratingCount : null,
  };
};
