import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";

const getServerMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.response?.data?.msg ||
  error?.message;

const isAuthFailure = (error) => {
  const status = error?.response?.status;
  const message = `${getServerMessage(error) || ""}`.toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    message.includes("token is not valid") ||
    message.includes("invalid token") ||
    message.includes("jwt")
  );
};

const withFriendlyAuthError = async (request) => {
  try {
    return await request();
  } catch (error) {
    if (isAuthFailure(error)) {
      throw {
        message: SESSION_EXPIRED_MESSAGE,
        authError: true,
        status: error?.response?.status,
      };
    }

    throw error;
  }
};

const AllProducts = (config = {}) =>
  axios.get(`${BASE}/all-products?query=ecom`, config);
const ProductById = (id) => axios.get(`${BASE}/product/${id}`);
const ProductByTitle = (title) => axios.get(`${BASE}/product-title/${title}`);
const ProductbyNumber = (count) => axios.get(`${BASE}/products/${count}`);
const ProductsByQuery = (slug) =>
  axios.get(`${BASE}/product?searchField=slug&value=${slug}`);

// ── Review Endpoints ───────────────────────────────────
const GetProductReviews = (productId) =>
  axios.get(`${BASE}/product/review/${productId}`);

const AddProductReview = (productId, data, token) =>
  withFriendlyAuthError(() =>
    axios.post(`${BASE}/product/review/${productId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );

const UpdateProductReview = (productId, data, token) =>
  withFriendlyAuthError(() =>
    axios.put(`${BASE}/product/review/${productId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );

const DeleteProductReview = (productId, reviewId, token) =>
  withFriendlyAuthError(() =>
    axios.delete(`${BASE}/product/review/${productId}?reviewId=${reviewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );

const ProductServiceOperations = {
  AllProducts,
  ProductById,
  ProductByTitle,
  ProductbyNumber,
  ProductsByQuery,
  GetProductReviews,
  AddProductReview,
  UpdateProductReview,
  DeleteProductReview,
};
export default ProductServiceOperations;
