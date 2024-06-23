import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const Allcategories = () => axios.get(`${BASE}/allcategories`);
const CategoryById = (id) => axios.get(`${BASE}/categtory/${id}`);
const CategoyByTitle = (title) => axios.get(`${BASE}/category/title/${title}`);

const CategoryServiceOperations = {
  Allcategories,
  CategoryById,
  CategoyByTitle,
};
export default CategoryServiceOperations;
