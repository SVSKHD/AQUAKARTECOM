import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

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
  axios.post(`${BASE}/product/review/${productId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

const UpdateProductReview = (productId, data, token) =>
  axios.put(`${BASE}/product/review/${productId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

const DeleteProductReview = (productId, reviewId, token) =>
  axios.delete(`${BASE}/product/review/${productId}?reviewId=${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

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
