import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const AllProducts = () => axios.get(`${BASE}/all-products`);
const ProductById = (id) => axios.get(`${BASE}/product/${id}`);
const ProductByTitle = (title) => axios.get(`${BASE}/product-title/${title}`);
const ProductbyNumber = (count) => axios.get(`${BASE}/products/${count}`);
const ProductsByQuery = (slug) =>
  axios.get(`${BASE}/product?searchField=slug&value=${slug}`);
const ProductServiceOperations = {
  AllProducts,
  ProductById,
  ProductByTitle,
  ProductbyNumber,
  ProductsByQuery,
};
export default ProductServiceOperations;
