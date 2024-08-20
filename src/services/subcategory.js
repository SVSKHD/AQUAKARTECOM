import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const AllSubcategories = () => axios.get(`${BASE}/all-subcategories`);
const SubCategoryById = (id) => axios.get(`${BASE}/categtory/${id}`);
const SubCategoryByTitle = (title) =>
  axios.get(`${BASE}/subcategory-title/${title}`);
const SubCategoryServiceOperations = {
  AllSubcategories,
  SubCategoryById,
  SubCategoryByTitle,
};
export default SubCategoryServiceOperations;
