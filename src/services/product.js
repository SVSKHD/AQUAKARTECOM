import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const AllProducts = () => axios.get(`${BASE}/all-products`);
const ProductById = (id) => axios.get(`${BASE}/product/${id}`);

const ProductServiceOperations = {
  AllProducts,
  ProductById,
};
export default ProductServiceOperations;
